use axum::{http::StatusCode, response::IntoResponse, routing::get, Router};

pub fn create_route() -> Router {
    Router::new().route("/health_check", get(health_check))
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}
