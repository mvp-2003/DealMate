use axum::{routing::get, Router};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub mod error;
pub mod routes;

use crate::routes::health_check;

pub fn app(pool: PgPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .merge(health_check::create_route())
        .with_state(pool)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}
