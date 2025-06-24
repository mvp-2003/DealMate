use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use bigdecimal::{BigDecimal, ToPrimitive};
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Partnership {
    pub id: i32,
    pub business_name: String,
    pub website: String,
    pub contact_email: String,
    pub contact_name: String,
    pub phone: Option<String>,
    pub business_type: String,
    pub monthly_revenue: Option<String>,
    pub cashback_rate: Option<BigDecimal>,
    pub description: Option<String>,
    pub average_order_value: Option<BigDecimal>,
    pub monthly_orders: Option<String>,
    pub status: PartnershipStatus,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
    pub reviewed_at: Option<OffsetDateTime>,
    pub reviewer_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "partnership_status", rename_all = "lowercase")]
pub enum PartnershipStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Active,
    Suspended,
}

#[derive(Debug, Deserialize)]
pub struct CreatePartnershipRequest {
    pub business_name: String,
    pub website: String,
    pub contact_email: String,
    pub contact_name: String,
    pub phone: Option<String>,
    pub business_type: String,
    pub monthly_revenue: Option<String>,
    pub cashback_rate: Option<f64>,
    pub description: Option<String>,
    pub average_order_value: Option<f64>,
    pub monthly_orders: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PartnershipResponse {
    pub id: i32,
    pub business_name: String,
    pub website: String,
    pub contact_email: String,
    pub contact_name: String,
    pub phone: Option<String>,
    pub business_type: String,
    pub monthly_revenue: Option<String>,
    pub cashback_rate: Option<f64>,
    pub description: Option<String>,
    pub average_order_value: Option<f64>,
    pub monthly_orders: Option<String>,
    pub status: PartnershipStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePartnershipRequest {
    pub status: Option<PartnershipStatus>,
    pub cashback_rate: Option<f64>,
    pub reviewer_notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PartnershipStats {
    pub total_applications: i32,
    pub pending_applications: i32,
    pub approved_partners: i32,
    pub active_partners: i32,
    pub total_cashback_paid: f64,
    pub monthly_transactions: i32,
}

impl From<Partnership> for PartnershipResponse {
    fn from(partnership: Partnership) -> Self {
        Self {
            id: partnership.id,
            business_name: partnership.business_name,
            website: partnership.website,
            contact_email: partnership.contact_email,
            contact_name: partnership.contact_name,
            phone: partnership.phone,
            business_type: partnership.business_type,
            monthly_revenue: partnership.monthly_revenue,
            cashback_rate: partnership.cashback_rate.and_then(|bd| bd.to_f64()),
            description: partnership.description,
            average_order_value: partnership.average_order_value.and_then(|bd| bd.to_f64()),
            monthly_orders: partnership.monthly_orders,
            status: partnership.status,
            created_at: DateTime::<Utc>::from_timestamp(
                partnership.created_at.unix_timestamp(),
                partnership.created_at.nanosecond()
            ).unwrap_or_default(),
            updated_at: DateTime::<Utc>::from_timestamp(
                partnership.updated_at.unix_timestamp(),
                partnership.updated_at.nanosecond()
            ).unwrap_or_default(),
        }
    }
}
