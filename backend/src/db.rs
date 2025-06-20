use sqlx::{Connection, PgConnection, PgPool};
use std::env;
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

    // Connect to the target database to create the pool.
    let pool = PgPool::connect(&db_url).await?;
    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}
