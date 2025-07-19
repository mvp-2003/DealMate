use serde::{Deserialize, Serialize};
use chrono::NaiveDateTime;
use uuid::Uuid;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub auth0_id: String,
    pub username: String,
    pub email: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
