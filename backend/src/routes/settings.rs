// backend/src/routes/settings.rs

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::settings::Settings;

pub async fn get_settings(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Settings>, StatusCode> {
    let settings = sqlx::query_as!(
        Settings,
        "SELECT id, user_id, theme, notifications_enabled, created_at, updated_at FROM settings WHERE user_id = $1",
        user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|err| {
        match err {
            sqlx::Error::RowNotFound => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    })?;

    Ok(Json(settings))
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettings {
    pub theme: Option<String>,
    pub notifications_enabled: Option<bool>,
}

pub async fn update_settings(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<UpdateSettings>,
) -> Result<Json<Settings>, StatusCode> {
    // Fetch the current settings
    let mut current_settings = sqlx::query_as!(
        Settings,
        "SELECT id, user_id, theme, notifications_enabled, created_at, updated_at FROM settings WHERE user_id = $1",
        user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    // Update fields if they are present in the payload
    if let Some(theme) = payload.theme {
        current_settings.theme = theme;
    }
    if let Some(notifications_enabled) = payload.notifications_enabled {
        current_settings.notifications_enabled = notifications_enabled;
    }

    // Save the updated settings
    let updated_settings = sqlx::query_as!(
        Settings,
        "UPDATE settings SET theme = $1, notifications_enabled = $2 WHERE user_id = $3 RETURNING id, user_id, theme, notifications_enabled, created_at, updated_at",
        current_settings.theme,
        current_settings.notifications_enabled,
        user_id,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(updated_settings))
}
