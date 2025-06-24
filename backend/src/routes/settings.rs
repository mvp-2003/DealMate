use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::settings::Settings;

pub async fn get_settings(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Settings>, StatusCode> {
    let settings = sqlx::query_as!(
        Settings,
        "SELECT user_id, preferred_platforms, alert_frequency, dark_mode, auto_apply_coupons, price_drop_notifications FROM settings WHERE user_id = $1",
        user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(settings))
}

pub async fn update_settings(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<Settings>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query!(
        "INSERT INTO settings (user_id, preferred_platforms, alert_frequency, dark_mode, auto_apply_coupons, price_drop_notifications)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE
         SET preferred_platforms = $2,
             alert_frequency = $3,
             dark_mode = $4,
             auto_apply_coupons = $5,
             price_drop_notifications = $6",
        user_id,
        &payload.preferred_platforms,
        &payload.alert_frequency,
        payload.dark_mode,
        payload.auto_apply_coupons,
        payload.price_drop_notifications
    )
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}
