use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("SQLx error: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("Environment variable not found: {0}")]
    EnvVar(#[from] std::env::VarError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Not found: {0}")]
    NotFound(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Sqlx(e) => {
                eprintln!("SQLx error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Database error: {}", e),
                )
            }
            AppError::EnvVar(e) => {
                eprintln!("Environment variable error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Configuration error: {}", e),
                )
            }
            AppError::Io(e) => {
                eprintln!("IO error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Internal server error: {}", e),
                )
            }
            AppError::NotFound(e) => {
                eprintln!("Not found error: {:?}", e);
                (
                    StatusCode::NOT_FOUND,
                    format!("Not found: {}", e),
                )
            }
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}
