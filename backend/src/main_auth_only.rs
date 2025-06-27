use axum::{
    routing::get,
    Router,
};
use dotenvy::dotenv;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;

use auth::{login_handler, signup_handler, callback_handler, logout_handler, protected_handler};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "dealpal_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(|| async { "DealPal Auth Server" }))
        .route("/auth/login", get(login_handler))
        .route("/auth/signup", get(signup_handler))
        .route("/auth/callback", get(callback_handler))
        .route("/auth/logout", get(logout_handler))
        .route("/auth/me", get(protected_handler))
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    let listener = TcpListener::bind(addr).await?;

    tracing::info!("Auth server listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}