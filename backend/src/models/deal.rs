use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use bigdecimal::BigDecimal;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Deal {
    pub id: i32,
    pub external_id: String,
    pub title: String,
    pub description: Option<String>,
    pub original_price: BigDecimal,
    pub discounted_price: Option<BigDecimal>,
    pub discount_percentage: Option<BigDecimal>,
    pub currency: String,
    pub product_url: String,
    pub image_url: Option<String>,
    pub merchant: String,
    pub category: Option<String>,
    pub deal_type: DealType,
    pub coupon_code: Option<String>,
    pub cashback_rate: Option<BigDecimal>,
    pub minimum_order_value: Option<BigDecimal>,
    pub maximum_discount: Option<BigDecimal>,
    pub valid_from: DateTime<Utc>,
    pub valid_until: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub is_verified: bool,
    pub verification_date: Option<DateTime<Utc>>,
    pub usage_count: i32,
    pub success_rate: Option<BigDecimal>,
    pub tags: Option<Vec<String>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "deal_type", rename_all = "lowercase")]
pub enum DealType {
    Coupon,
    Cashback,
    PriceDiscount,
    BankOffer,
    WalletOffer,
    FlashSale,
    BuyOneGetOne,
    FreeShipping,
    GiftCard,
    Referral,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDealRequest {
    pub external_id: String,
    pub title: String,
    pub description: Option<String>,
    pub original_price: BigDecimal,
    pub discounted_price: Option<BigDecimal>,
    pub discount_percentage: Option<BigDecimal>,
    pub currency: String,
    pub product_url: String,
    pub image_url: Option<String>,
    pub merchant: String,
    pub category: Option<String>,
    pub deal_type: DealType,
    pub coupon_code: Option<String>,
    pub cashback_rate: Option<BigDecimal>,
    pub minimum_order_value: Option<BigDecimal>,
    pub maximum_discount: Option<BigDecimal>,
    pub valid_from: DateTime<Utc>,
    pub valid_until: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DealSearchRequest {
    pub query: Option<String>,
    pub category: Option<String>,
    pub merchant: Option<String>,
    pub deal_type: Option<DealType>,
    pub min_discount: Option<f64>,
    pub max_price: Option<f64>,
    pub currency: Option<String>,
    pub only_active: Option<bool>,
    pub only_verified: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DealSearchResponse {
    pub deals: Vec<Deal>,
    pub total_count: i64,
    pub has_more: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DealValidationRequest {
    pub deal_id: i32,
    pub test_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DealValidationResponse {
    pub is_valid: bool,
    pub validation_message: String,
    pub tested_at: DateTime<Utc>,
    pub response_time_ms: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DealAggregationRequest {
    pub sources: Vec<String>,
    pub categories: Option<Vec<String>>,
    pub merchants: Option<Vec<String>>,
    pub max_deals_per_source: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DealAggregationResponse {
    pub total_deals_found: i32,
    pub new_deals_added: i32,
    pub updated_deals: i32,
    pub invalid_deals: i32,
    pub processing_time_ms: i64,
    pub sources_processed: Vec<String>,
}

impl Deal {
    pub fn calculate_savings(&self) -> BigDecimal {
        use std::str::FromStr;
        
        match &self.discounted_price {
            Some(discounted) => &self.original_price - discounted,
            None => match &self.discount_percentage {
                Some(percentage) => {
                    let hundred = BigDecimal::from_str("100").unwrap();
                    &self.original_price * (percentage / &hundred)
                }
                None => BigDecimal::from_str("0").unwrap(),
            }
        }
    }

    pub fn get_final_price(&self) -> BigDecimal {
        use std::str::FromStr;
        
        match &self.discounted_price {
            Some(discounted) => discounted.clone(),
            None => match &self.discount_percentage {
                Some(percentage) => {
                    let hundred = BigDecimal::from_str("100").unwrap();
                    let one = BigDecimal::from_str("1").unwrap();
                    &self.original_price * (&one - (percentage / &hundred))
                }
                None => self.original_price.clone(),
            }
        }
    }

    pub fn is_expired(&self) -> bool {
        match self.valid_until {
            Some(expiry) => expiry < Utc::now(),
            None => false,
        }
    }

    pub fn days_until_expiry(&self) -> Option<i64> {
        match self.valid_until {
            Some(expiry) => {
                let duration = expiry.signed_duration_since(Utc::now());
                Some(duration.num_days())
            }
            None => None,
        }
    }
}

// Database operations
impl Deal {
    pub async fn create(
        pool: &sqlx::PgPool,
        request: CreateDealRequest,
    ) -> Result<Deal, sqlx::Error> {
        let deal = sqlx::query_as!(
            Deal,
            r#"
            INSERT INTO deals (
                external_id, title, description, original_price, discounted_price,
                discount_percentage, currency, product_url, image_url, merchant,
                category, deal_type, coupon_code, cashback_rate, minimum_order_value,
                maximum_discount, valid_from, valid_until, tags, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *
            "#,
            request.external_id,
            request.title,
            request.description,
            request.original_price,
            request.discounted_price,
            request.discount_percentage,
            request.currency,
            request.product_url,
            request.image_url,
            request.merchant,
            request.category,
            request.deal_type as DealType,
            request.coupon_code,
            request.cashback_rate,
            request.minimum_order_value,
            request.maximum_discount,
            request.valid_from,
            request.valid_until,
            request.tags.as_deref(),
            Utc::now(),
            Utc::now()
        )
        .fetch_one(pool)
        .await?;

        Ok(deal)
    }

    pub async fn find_by_id(pool: &sqlx::PgPool, id: i32) -> Result<Option<Deal>, sqlx::Error> {
        let deal = sqlx::query_as!(Deal, "SELECT * FROM deals WHERE id = $1", id)
            .fetch_optional(pool)
            .await?;

        Ok(deal)
    }

    pub async fn search(
        pool: &sqlx::PgPool,
        request: DealSearchRequest,
    ) -> Result<DealSearchResponse, sqlx::Error> {
        let limit = request.limit.unwrap_or(20).min(100);
        let offset = request.offset.unwrap_or(0);

        // For now, implement a simplified search that works with sqlx compile-time checks
        // In a production system, you'd want to use a query builder or dynamic SQL library
        
        let deals = if let Some(query_text) = &request.query {
            sqlx::query_as!(
                Deal,
                "SELECT * FROM deals WHERE (title ILIKE $1 OR description ILIKE $1) AND is_active = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
                format!("%{}%", query_text),
                request.only_active.unwrap_or(true),
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        } else if let Some(category) = &request.category {
            sqlx::query_as!(
                Deal,
                "SELECT * FROM deals WHERE category = $1 AND is_active = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
                category,
                request.only_active.unwrap_or(true),
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        } else if let Some(merchant) = &request.merchant {
            sqlx::query_as!(
                Deal,
                "SELECT * FROM deals WHERE merchant = $1 AND is_active = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
                merchant,
                request.only_active.unwrap_or(true),
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as!(
                Deal,
                "SELECT * FROM deals WHERE is_active = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                request.only_active.unwrap_or(true),
                limit,
                offset
            )
            .fetch_all(pool)
            .await?
        };

        let total_count: i64 = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM deals WHERE is_active = $1",
            request.only_active.unwrap_or(true)
        )
        .fetch_one(pool)
        .await?;

        let has_more = (offset + limit as i32) < total_count as i32;

        Ok(DealSearchResponse {
            deals,
            total_count,
            has_more,
        })
    }

    pub async fn update_verification_status(
        pool: &sqlx::PgPool,
        id: i32,
        is_verified: bool,
        success_rate: Option<BigDecimal>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE deals SET is_verified = $1, verification_date = $2, success_rate = $3, updated_at = $4 WHERE id = $5",
            is_verified,
            Utc::now(),
            success_rate,
            Utc::now(),
            id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn increment_usage(pool: &sqlx::PgPool, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE deals SET usage_count = usage_count + 1, updated_at = $1 WHERE id = $2",
            Utc::now(),
            id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get_trending_deals(
        pool: &sqlx::PgPool,
        limit: Option<i32>,
    ) -> Result<Vec<Deal>, sqlx::Error> {
        let limit = limit.unwrap_or(10);

        let deals = sqlx::query_as!(
            Deal,
            "SELECT * FROM deals WHERE is_active = true AND is_verified = true ORDER BY usage_count DESC, success_rate DESC LIMIT $1",
            limit
        )
        .fetch_all(pool)
        .await?;

        Ok(deals)
    }
}
