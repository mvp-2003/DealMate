use axum::{
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub mod db;
pub mod error;
pub mod models;
pub mod routes;

use crate::routes::{health_check, wallet, deals};

// Create a new function for wallet routes to improve modularity
fn wallet_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/wallet", post(wallet::create_wallet))
        .route(
            "/wallet/:wallet_id",
            get(wallet::get_wallet).delete(wallet::delete_wallet),
        )
        .with_state(pool)
}

pub fn app(pool: PgPool) -> Router {
    // Add comments to clarify middleware setup
    let cors = CorsLayer::new()
        .allow_origin(Any) // Allow all origins for now; consider restricting in production
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/health_check", get(health_check::health_check))
        .route("/api/deals", get(deals::get_deals).post(deals::handle_product_detection))
        .merge(wallet_routes(pool.clone()))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}
