use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub bank: String,
    pub card_type: String,
    pub reward_rate: f64,
    pub current_points: i32,
    pub threshold: i32,
    pub reward_value: f64,
}
