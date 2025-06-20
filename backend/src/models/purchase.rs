use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct Purchase {
    pub id: Uuid,
    pub user_id: Uuid,
    pub product_id: String,
    pub price: f64,
    pub saved: f64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}
