use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::PrimitiveDateTime;
use uuid::Uuid;

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct Purchase {
    pub id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub product_id: Option<String>,
    pub price: Option<f64>,
    pub saved: Option<f64>,
    pub timestamp: Option<PrimitiveDateTime>,
}
