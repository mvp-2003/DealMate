use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::wallet::{NewWallet, UpdateWallet, Wallet};

// Define a more specific error type for wallet operations
#[derive(Debug)]
pub enum WalletError {
    NotFound,
    DatabaseError(sqlx::Error),
}

impl From<sqlx::Error> for WalletError {
    fn from(err: sqlx::Error) -> Self {
        WalletError::DatabaseError(err)
    }
}

impl IntoResponse for WalletError {
    fn into_response(self) -> axum::response::Response {
        let (status, error_message) = match self {
            WalletError::NotFound => (StatusCode::NOT_FOUND, "Wallet not found"),
            WalletError::DatabaseError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error",
            ),
        };
        (status, Json(json!({ "error": error_message }))).into_response()
    }
}

#[axum::debug_handler]
pub async fn get_wallet(
    State(pool): State<PgPool>,
    Path(wallet_id): Path<Uuid>,
) -> Result<Json<Wallet>, WalletError> {
    let wallet = sqlx::query_as!(
        Wallet,
        "SELECT id, user_id, balance, created_at, updated_at FROM wallets WHERE id = $1",
        wallet_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|err| match err {
        sqlx::Error::RowNotFound => WalletError::NotFound,
        _ => WalletError::DatabaseError(err),
    })?;
    Ok(Json(wallet))
}

#[axum::debug_handler]
pub async fn create_wallet(
    State(pool): State<PgPool>,
    Json(payload): Json<NewWallet>,
) -> Result<impl IntoResponse, WalletError> {
    let wallet = sqlx::query_as!(
        Wallet,
        "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id, user_id, balance, created_at, updated_at",
        payload.user_id,
        payload.balance
    )
    .fetch_one(&pool)
    .await?;
    Ok((StatusCode::CREATED, Json(wallet)))
}

#[axum::debug_handler]
pub async fn update_wallet(
    State(pool): State<PgPool>,
    Path(wallet_id): Path<Uuid>,
    Json(payload): Json<UpdateWallet>,
) -> Result<Json<Wallet>, WalletError> {
    let wallet = sqlx::query_as!(
        Wallet,
        "UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2 RETURNING id, user_id, balance, created_at, updated_at",
        payload.balance,
        wallet_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| WalletError::NotFound)?;
    Ok(Json(wallet))
}

#[axum::debug_handler]
pub async fn delete_wallet(
    State(pool): State<PgPool>,
    Path(wallet_id): Path<Uuid>,
) -> Result<StatusCode, WalletError> {
    let result = sqlx::query!("DELETE FROM wallets WHERE id = $1", wallet_id)
        .execute(&pool)
        .await
        .map_err(|_| WalletError::NotFound)?;

    if result.rows_affected() == 0 {
        return Err(WalletError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
