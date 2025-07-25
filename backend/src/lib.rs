use axum::{
    routing::{get, post},
    Router,
    Extension,
};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use std::sync::Arc;

pub mod auth;
pub mod coupon_aggregator;
pub mod db;
pub mod error;
pub mod kafka;
pub mod lazy_db;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod proxy;
pub mod pricer;
pub mod stacksmart;
pub mod analyzer;
pub mod performance;

use crate::routes::{card_vault, coupons, deals, health_check, offer_ranking, settings, wallet};
use crate::auth::{login_handler, signup_handler, callback_handler, logout_handler, protected_handler};
use crate::middleware::auth_middleware;
use crate::proxy::{auth_proxy, ai_proxy, AppState};
use crate::performance::{performance_middleware, create_compression_layer, create_performance_headers_layer};
use crate::lazy_db::{LazyDbService, start_cache_cleanup_task};
use axum::middleware::from_fn;

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

fn settings_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/settings/:user_id", get(settings::get_settings).put(settings::update_settings))
        .with_state(pool)
}

// fn partnerships_routes(pool: PgPool) -> Router {
//     Router::new()
//         .nest("/partnerships", partnerships::create_router())
//         .with_state(pool)
// }

fn coupon_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/search", get(coupons::search_coupons))
        .route("/merchants", post(coupons::create_merchant))
        .route("/", post(coupons::create_coupon))
        .route("/test", post(coupons::test_coupons))
        .with_state(pool)
}

fn user_routes(pool: PgPool) -> Router {
    // TODO: Implement user routes
    Router::new()
        // .route("/", post(user::create_user))
        // .route(
        //     "/:user_id",
        //     get(user::get_user)
        //         .put(user::update_user)
        //         .delete(user::delete_user),
        // )
        .with_state(pool)
}

fn auth_routes() -> Router {
    Router::new()
        .route("/login", get(login_handler))
        .route("/signup", get(signup_handler))
        .route("/callback", get(callback_handler))
        .route("/logout", get(logout_handler))
        .route("/me", get(protected_handler))
}

pub fn app(pool: PgPool, app_state: AppState) -> Router {
    let lazy_db_service = Arc::new(LazyDbService::new(pool.clone()));
    
    let cleanup_service = lazy_db_service.clone();
    tokio::spawn(async move {
        start_cache_cleanup_task(cleanup_service).await;
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let protected_routes = Router::new()
        .nest("/deals", deals::deals_routes(pool.clone()))
        .nest("/wallet", wallet_routes(pool.clone()))
        .nest("/settings", settings_routes(pool.clone()))
        // .nest("/partnerships", partnerships_routes(pool.clone()))
        .nest("/users", user_routes(pool.clone()))
        .nest("/coupons", coupon_routes(pool.clone()))
        .nest("/offers", offer_ranking::offer_ranking_routes(pool.clone()))
        .merge(card_vault::routes(pool.clone()))
        .layer(Extension(lazy_db_service))
        .route_layer(from_fn(auth_middleware));

    let proxy_routes = Router::new()
        .route("/auth/*path", axum::routing::any(auth_proxy))
        .route("/ai/*path", axum::routing::any(ai_proxy))
        .with_state(app_state);

    Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/health_check", get(health_check::health_check))
        .nest("/api/v1", protected_routes)
        .merge(card_vault::public_routes())
        .merge(proxy_routes)
        .layer(from_fn(performance_middleware))
        .layer(create_compression_layer())
        .layer(create_performance_headers_layer())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}
