use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub balance: BigDecimal,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, Deserialize)]
pub struct NewWallet {
    pub user_id: Uuid,
    pub balance: BigDecimal,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWallet {
    pub balance: BigDecimal,
}
