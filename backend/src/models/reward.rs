use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct Reward {
    pub user_id: Uuid,
    pub goal: String,
    pub target_points: i32,
    pub reward_value: f64,
    pub unlocked: bool,
}
