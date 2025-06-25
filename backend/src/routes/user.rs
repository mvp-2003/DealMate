use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use time::{OffsetDateTime, PrimitiveDateTime};
use uuid::Uuid;

use crate::models::user::User;

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub auth0_id: String,
    pub username: String,
    pub email: Option<String>,
}

pub async fn create_user(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateUser>,
) -> Result<(StatusCode, Json<User>), StatusCode> {
    let now = OffsetDateTime::now_utc();
    let primitive_now = PrimitiveDateTime::new(now.date(), now.time());

    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (id, auth0_id, username, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, auth0_id, username, email, created_at, updated_at",
        Uuid::new_v4(),
        payload.auth0_id,
        payload.username,
        payload.email,
        primitive_now,
        primitive_now,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(user)))
}

pub async fn get_user(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<User>, StatusCode> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, auth0_id, username, email, created_at, updated_at FROM users WHERE id = $1",
        user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

#[derive(Debug, Deserialize)]
pub struct UpdateUser {
    pub username: String,
    pub email: Option<String>,
}

pub async fn update_user(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<UpdateUser>,
) -> Result<Json<User>, StatusCode> {
    let now = OffsetDateTime::now_utc();
    let primitive_now = PrimitiveDateTime::new(now.date(), now.time());
    let user = sqlx::query_as!(
        User,
        "UPDATE users SET username = $1, email = $2, updated_at = $3 WHERE id = $4 RETURNING id, auth0_id, username, email, created_at, updated_at",
        payload.username,
        payload.email,
        primitive_now,
        user_id,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

pub async fn delete_user(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query!("DELETE FROM users WHERE id = $1", user_id)
        .execute(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}
