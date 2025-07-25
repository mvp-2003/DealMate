use dealmate_backend::app;
use dealmate_backend::db;
use dealmate_backend::proxy::AppState;
use std::net::SocketAddr;
use std::str::FromStr;
use tokio::net::TcpListener;
use tokio::signal;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load from project root .env file
    dotenvy::from_filename("../.env").expect(".env file not found in project root");

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "dealmate_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let pool = db::create_pool().await?;

    db::run_migrations(&pool).await?;

    let auth_service_addr = std::env::var("AUTH_SERVICE_URL")
        .unwrap_or_else(|_| "127.0.0.1:3001".to_string());
    let ai_service_addr = std::env::var("AI_SERVICE_URL")
        .unwrap_or_else(|_| "127.0.0.1:8001".to_string());

    let app_state = AppState {
        auth_service_addr: SocketAddr::from_str(&auth_service_addr).unwrap(),
        ai_service_addr: SocketAddr::from_str(&ai_service_addr).unwrap(),
    };

    let app = app(pool, app_state);
    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    let listener = TcpListener::bind(addr).await?;

    tracing::debug!("listening on {}", addr);

    // Run the server with graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("signal received, starting graceful shutdown");
}
