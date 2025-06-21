use axum_server::Handle;
use dealpal_backend::app;
use dealpal_backend::db;
use dotenvy::dotenv;
use std::net::SocketAddr;
use tokio::signal;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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

    let pool = db::create_pool().await?;

    db::run_migrations(&pool).await?;

    let app = app(pool);
    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    let handle = Handle::new();

    // Spawn a task to gracefully shutdown the server.
    tokio::spawn(shutdown_signal(handle.clone()));

    tracing::debug!("listening on {}", addr);

    // Run the server with graceful shutdown
    axum_server::bind(addr)
        .handle(handle)
        .serve(app)
        .await?;

    Ok(())
}

async fn shutdown_signal(handle: Handle) {
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
    handle.graceful_shutdown(None);
}
