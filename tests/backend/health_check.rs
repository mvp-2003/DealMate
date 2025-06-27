use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use dealpal_backend::app;
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use tower::ServiceExt;

#[tokio::test]
async fn test_health_check() {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool.");

    let app = app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health_check")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    assert_eq!(&body[..], b"OK");
}
