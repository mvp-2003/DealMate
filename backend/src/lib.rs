use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub mod error;
pub mod models;
pub mod routes;

use crate::routes::{health_check, wallet};

pub fn app(pool: PgPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/health_check", get(health_check::health_check))
        .route(
            "/wallet",
            get(wallet::get_wallet)
                .post(wallet::create_wallet)
                .put(wallet::update_wallet)
                .delete(wallet::delete_wallet),
        )
        .with_state(pool)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}
