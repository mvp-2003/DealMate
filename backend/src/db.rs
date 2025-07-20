use sqlx::{Connection, PgConnection, PgPool, postgres::PgPoolOptions};
use std::env;
use std::time::Duration;
use tracing::info;
use url::Url;

pub async fn create_pool() -> Result<PgPool, sqlx::Error> {
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let mut url = Url::parse(&db_url).expect("Failed to parse DATABASE_URL");
    let db_name = url.path().trim_start_matches('/').to_string();

    // Connect to the default 'postgres' database to check for the existence of the target database.
    url.set_path("/postgres");
    let mut conn = PgConnection::connect(url.as_str()).await?;

    // Optimize database existence check by using a single query
    let db_exists = sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1)")
        .bind(&db_name)
        .fetch_one(&mut conn)
        .await
        .unwrap_or(false);

    if !db_exists {
        info!("Creating database {}", db_name);
        sqlx::query(&format!("CREATE DATABASE \"{}\"", db_name))
            .execute(&mut conn)
            .await
            .expect("Failed to create database");
        info!("Create database success");
    } else {
        info!("Database already exists");
    }

    // Create optimized connection pool with performance settings
    let pool = PgPoolOptions::new()
        .max_connections(20) // Increased for better concurrency
        .min_connections(5)  // Maintain minimum connections
        .acquire_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(600)) // 10 minutes
        .max_lifetime(Duration::from_secs(1800)) // 30 minutes
        .test_before_acquire(true) // Validate connections
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                // Optimize connection settings for performance
                sqlx::query("SET statement_timeout = '60s'")
                    .execute(&mut *conn)
                    .await?;
                sqlx::query("SET lock_timeout = '30s'")
                    .execute(&mut *conn)
                    .await?;
                sqlx::query("SET idle_in_transaction_session_timeout = '60s'")
                    .execute(&mut *conn)
                    .await?;
                // Enable query plan caching
                sqlx::query("SET plan_cache_mode = 'auto'")
                    .execute(&mut *conn)
                    .await?;
                Ok(())
            })
        })
        .connect(&db_url)
        .await?;
    
    Ok(pool)
}

use sqlx::migrate::Migrator;
use tracing::error;

#[cfg(test)]
mod tests {
    use super::*;
    use dotenvy::dotenv;

    #[tokio::test]
    async fn test_database_connection() {
        dotenv().ok();
        let pool = create_pool().await.expect("Failed to create database pool");
        
        // Simple query to test connection
        let result = sqlx::query("SELECT 1 as test")
            .fetch_one(&pool)
            .await;
            
        assert!(result.is_ok(), "Database connection failed");
    }
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    info!("Running migrations");
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let migrations_path = format!("{}/migrations", manifest_dir);
    info!("Migrations path: {}", migrations_path);

    let migrator = Migrator::new(std::path::Path::new(&migrations_path)).await.unwrap();
    migrator.run(pool).await.map_err(|e| {
        error!("Failed to run migrations: {}", e);
        sqlx::Error::Protocol(e.to_string())
    })?;

    Ok(())
}
