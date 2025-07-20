use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tracing::debug;

// Cache entry with TTL
#[derive(Debug, Clone)]
pub struct CacheEntry<T> {
    pub data: T,
    pub expires_at: Instant,
}

impl<T> CacheEntry<T> {
    pub fn new(data: T, ttl: Duration) -> Self {
        Self {
            data,
            expires_at: Instant::now() + ttl,
        }
    }

    pub fn is_expired(&self) -> bool {
        Instant::now() > self.expires_at
    }
}

// Query cache for expensive operations
#[derive(Debug)]
pub struct QueryCache<T> {
    cache: Arc<RwLock<HashMap<String, CacheEntry<T>>>>,
    default_ttl: Duration,
}

impl<T: Clone> QueryCache<T> {
    pub fn new(default_ttl: Duration) -> Self {
        Self {
            cache: Arc::new(RwLock::new(HashMap::new())),
            default_ttl,
        }
    }

    pub async fn get(&self, key: &str) -> Option<T> {
        let cache = self.cache.read().await;
        if let Some(entry) = cache.get(key) {
            if !entry.is_expired() {
                debug!("Cache hit for key: {}", key);
                return Some(entry.data.clone());
            }
        }
        debug!("Cache miss for key: {}", key);
        None
    }

    pub async fn set(&self, key: String, data: T, ttl: Option<Duration>) {
        let ttl = ttl.unwrap_or(self.default_ttl);
        let mut cache = self.cache.write().await;
        cache.insert(key, CacheEntry::new(data, ttl));
    }

    pub async fn invalidate(&self, key: &str) {
        let mut cache = self.cache.write().await;
        cache.remove(key);
    }

    pub async fn clear_expired(&self) {
        let mut cache = self.cache.write().await;
        cache.retain(|_, entry| !entry.is_expired());
    }
}

// Lazy loading database service
pub struct LazyDbService {
    pool: PgPool,
    user_cache: QueryCache<serde_json::Value>,
    deal_cache: QueryCache<serde_json::Value>,
    card_cache: QueryCache<serde_json::Value>,
}

impl LazyDbService {
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool,
            user_cache: QueryCache::new(Duration::from_secs(300)), // 5 minutes
            deal_cache: QueryCache::new(Duration::from_secs(60)),  // 1 minute
            card_cache: QueryCache::new(Duration::from_secs(600)), // 10 minutes
        }
    }

    // Lazy load user data with caching
    pub async fn get_user_lazy(&self, user_id: &str) -> Result<Option<serde_json::Value>, sqlx::Error> {
        let cache_key = format!("user:{}", user_id);
        
        // Try cache first
        if let Some(cached) = self.user_cache.get(&cache_key).await {
            return Ok(Some(cached));
        }

        // Load from database
        let user = sqlx::query_as::<_, (serde_json::Value,)>(
            "SELECT row_to_json(u.*) FROM users u WHERE u.id = $1"
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?;

        if let Some((user_data,)) = user {
            self.user_cache.set(cache_key, user_data.clone(), None).await;
            Ok(Some(user_data))
        } else {
            Ok(None)
        }
    }

    // Lazy load deals with pagination and caching
    pub async fn get_deals_lazy(
        &self, 
        limit: i64, 
        offset: i64, 
        filters: Option<&str>
    ) -> Result<Vec<serde_json::Value>, sqlx::Error> {
        let cache_key = format!("deals:{}:{}:{}", limit, offset, filters.unwrap_or(""));
        
        // Try cache first
        if let Some(cached) = self.deal_cache.get(&cache_key).await {
            return Ok(vec![cached]);
        }

        let query = if let Some(filter) = filters {
            sqlx::query_as::<_, (serde_json::Value,)>(
                "SELECT row_to_json(d.*) FROM deals d WHERE d.title ILIKE $1 OR d.description ILIKE $1 
                 ORDER BY d.created_at DESC LIMIT $2 OFFSET $3"
            )
            .bind(format!("%{}%", filter))
            .bind(limit)
            .bind(offset)
        } else {
            sqlx::query_as::<_, (serde_json::Value,)>(
                "SELECT row_to_json(d.*) FROM deals d ORDER BY d.created_at DESC LIMIT $1 OFFSET $2"
            )
            .bind(limit)
            .bind(offset)
        };

        let deals: Vec<(serde_json::Value,)> = query.fetch_all(&self.pool).await?;
        let deal_data: Vec<serde_json::Value> = deals.into_iter().map(|(d,)| d).collect();
        
        // Cache the results
        if !deal_data.is_empty() {
            self.deal_cache.set(cache_key, deal_data[0].clone(), Some(Duration::from_secs(30))).await;
        }

        Ok(deal_data)
    }

    // Lazy load user cards with smart caching
    pub async fn get_user_cards_lazy(&self, user_id: &str) -> Result<Vec<serde_json::Value>, sqlx::Error> {
        let cache_key = format!("cards:{}", user_id);
        
        // Try cache first
        if let Some(cached) = self.card_cache.get(&cache_key).await {
            return Ok(vec![cached]);
        }

        let cards: Vec<(serde_json::Value,)> = sqlx::query_as::<_, (serde_json::Value,)>(
            "SELECT row_to_json(c.*) FROM user_cards c WHERE c.user_id = $1 ORDER BY c.created_at DESC"
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        let card_data: Vec<serde_json::Value> = cards.into_iter().map(|(c,)| c).collect();
        
        // Cache the results
        if !card_data.is_empty() {
            self.card_cache.set(cache_key, card_data[0].clone(), None).await;
        }

        Ok(card_data)
    }

    // Invalidate user-related caches
    pub async fn invalidate_user_cache(&self, user_id: &str) {
        self.user_cache.invalidate(&format!("user:{}", user_id)).await;
        self.card_cache.invalidate(&format!("cards:{}", user_id)).await;
    }

    // Batch invalidation for deal cache
    pub async fn invalidate_deal_cache(&self) {
        // Clear all deal cache entries
        let cache = self.deal_cache.cache.clone();
        let mut cache_write = cache.write().await;
        cache_write.retain(|key, _| !key.starts_with("deals:"));
    }

    // Cleanup expired entries periodically
    pub async fn cleanup_expired_cache(&self) {
        self.user_cache.clear_expired().await;
        self.deal_cache.clear_expired().await;
        self.card_cache.clear_expired().await;
    }
}

// Background task for cache cleanup
pub async fn start_cache_cleanup_task(db_service: Arc<LazyDbService>) {
    let mut interval = tokio::time::interval(Duration::from_secs(300)); // 5 minutes
    
    loop {
        interval.tick().await;
        db_service.cleanup_expired_cache().await;
        debug!("Cache cleanup completed");
    }
}
