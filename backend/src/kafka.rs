use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord, Producer};
use rdkafka::util::Timeout;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Clone)]
pub struct KafkaProducer {
    producer: FutureProducer,
    topics: KafkaTopics,
}

#[derive(Debug, Clone)]
pub struct KafkaTopics {
    pub deals: String,
    pub prices: String,
    pub user_events: String,
    pub notifications: String,
    pub inventory: String,
    pub analytics: String,
}

impl Default for KafkaTopics {
    fn default() -> Self {
        Self {
            deals: "dealpal.deals".to_string(),
            prices: "dealpal.prices".to_string(),
            user_events: "dealpal.user.events".to_string(),
            notifications: "dealpal.notifications".to_string(),
            inventory: "dealpal.inventory".to_string(),
            analytics: "dealpal.analytics".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DealEvent {
    pub event_id: String,
    pub timestamp: i64,
    pub event_type: DealEventType,
    pub deal_id: String,
    pub product_id: String,
    pub retailer: String,
    pub original_price: f64,
    pub discounted_price: f64,
    pub discount_percentage: f64,
    pub currency: String,
    pub category: String,
    pub subcategory: Option<String>,
    pub coupon_code: Option<String>,
    pub expiration_time: Option<i64>,
    pub tags: Vec<String>,
    pub metadata: std::collections::HashMap<String, String>,
    pub region: String,
    pub source: String,
}

impl Default for DealEvent {
    fn default() -> Self {
        Self {
            event_id: Uuid::new_v4().to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
            event_type: DealEventType::DealCreated,
            deal_id: String::new(),
            product_id: String::new(),
            retailer: String::new(),
            original_price: 0.0,
            discounted_price: 0.0,
            discount_percentage: 0.0,
            currency: "USD".to_string(),
            category: String::new(),
            subcategory: None,
            coupon_code: None,
            expiration_time: None,
            tags: Vec::new(),
            metadata: std::collections::HashMap::new(),
            region: "US".to_string(),
            source: "dealpal-backend".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DealEventType {
    DealCreated,
    DealUpdated,
    DealExpired,
    DealActivated,
    DealDeactivated,
    UserSubmitted,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PriceChangeEvent {
    pub event_id: String,
    pub timestamp: i64,
    pub product_id: String,
    pub retailer: String,
    pub previous_price: f64,
    pub current_price: f64,
    pub price_change: f64,
    pub price_change_percentage: f64,
    pub currency: String,
    pub change_type: PriceChangeType,
    pub is_significant: bool,
    pub availability: AvailabilityStatus,
    pub stock_level: Option<i32>,
    pub metadata: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PriceChangeType {
    Increase,
    Decrease,
    FlashSale,
    RegularPriceRestored,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AvailabilityStatus {
    InStock,
    LowStock,
    OutOfStock,
    Backorder,
    Discontinued,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserEvent {
    pub event_id: String,
    pub timestamp: i64,
    pub user_id: Option<String>,
    pub session_id: String,
    pub event_type: UserEventType,
    pub platform: Platform,
    pub deal_id: Option<String>,
    pub product_id: Option<String>,
    pub search_query: Option<String>,
    pub category: Option<String>,
    pub page_url: Option<String>,
    pub referrer: Option<String>,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
    pub metadata: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserEventType {
    PageView,
    DealView,
    DealClick,
    DealActivate,
    Search,
    FilterApply,
    WishlistAdd,
    WishlistRemove,
    NotificationClick,
    PurchaseComplete,
    UserSignup,
    UserLogin,
    UserLogout,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Platform {
    Web,
    MobileApp,
    BrowserExtension,
}

impl KafkaProducer {
    pub fn new() -> Result<Self, rdkafka::error::KafkaError> {
        let brokers = std::env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:9092".to_string());
        
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &brokers)
            .set("message.timeout.ms", "5000")
            .set("queue.buffering.max.messages", "10000")
            .set("queue.buffering.max.ms", "100")
            .set("batch.size", "16384")
            .set("linger.ms", "5")
            .set("compression.type", "lz4")
            .set("acks", "1")
            .set("retries", "3")
            .set("retry.backoff.ms", "100")
            .create()?;

        let topics = KafkaTopics::default();
        
        info!("Kafka producer initialized with brokers: {}", brokers);
        
        Ok(Self { producer, topics })
    }

    pub async fn publish_deal_event(&self, event: DealEvent) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let payload = serde_json::to_string(&event)?;
        let record = FutureRecord::to(&self.topics.deals)
            .key(&event.deal_id)
            .payload(&payload);

        match self.producer.send(record, Timeout::After(Duration::from_secs(5))).await {
            Ok((partition, offset)) => {
                info!("Deal event published: topic={}, partition={}, offset={}, deal_id={}", 
                      self.topics.deals, partition, offset, event.deal_id);
                Ok(())
            }
            Err((kafka_error, _)) => {
                error!("Failed to publish deal event: {}", kafka_error);
                Err(Box::new(kafka_error))
            }
        }
    }

    pub async fn publish_price_change_event(&self, event: PriceChangeEvent) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let payload = serde_json::to_string(&event)?;
        let record = FutureRecord::to(&self.topics.prices)
            .key(&event.product_id)
            .payload(&payload);

        match self.producer.send(record, Timeout::After(Duration::from_secs(5))).await {
            Ok((partition, offset)) => {
                info!("Price change event published: topic={}, partition={}, offset={}, product_id={}", 
                      self.topics.prices, partition, offset, event.product_id);
                Ok(())
            }
            Err((kafka_error, _)) => {
                error!("Failed to publish price change event: {}", kafka_error);
                Err(Box::new(kafka_error))
            }
        }
    }

    pub async fn publish_user_event(&self, event: UserEvent) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let payload = serde_json::to_string(&event)?;
        let key = event.user_id.as_ref().unwrap_or(&event.session_id);
        let record = FutureRecord::to(&self.topics.user_events)
            .key(key)
            .payload(&payload);

        match self.producer.send(record, Timeout::After(Duration::from_secs(5))).await {
            Ok((partition, offset)) => {
                info!("User event published: topic={}, partition={}, offset={}, session_id={}", 
                      self.topics.user_events, partition, offset, event.session_id);
                Ok(())
            }
            Err((kafka_error, _)) => {
                error!("Failed to publish user event: {}", kafka_error);
                Err(Box::new(kafka_error))
            }
        }
    }

    pub fn health_check(&self) -> bool {
        // Simple health check by getting metadata
        match self.producer.client().fetch_metadata(None, Duration::from_secs(5)) {
            Ok(_) => {
                info!("Kafka producer health check: OK");
                true
            }
            Err(e) => {
                warn!("Kafka producer health check failed: {}", e);
                false
            }
        }
    }
}
