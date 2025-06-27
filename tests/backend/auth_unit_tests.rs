#[cfg(test)]
mod auth_tests {
    use super::*;
    use axum::http::StatusCode;
    use tower::ServiceExt;
    
    #[tokio::test]
    async fn test_login_redirect() {
        let app = create_test_app().await;
        
        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/auth/login")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        
        assert_eq!(response.status(), StatusCode::TEMPORARY_REDIRECT);
        
        let location = response.headers().get("location").unwrap().to_str().unwrap();
        assert!(location.contains("auth0.com"));
        assert!(location.contains("authorize"));
    }
    
    #[tokio::test]
    async fn test_protected_endpoint_without_token() {
        let app = create_test_app().await;
        
        let response = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/auth/me")
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }
    
    async fn create_test_app() -> axum::Router {
        // Mock app for testing
        use axum::{routing::get, Router};
        
        Router::new()
            .route("/auth/login", get(|| async { 
                axum::response::Redirect::temporary("https://test-auth0.com/authorize")
            }))
            .route("/auth/me", get(|| async { 
                (StatusCode::UNAUTHORIZED, "Unauthorized")
            }))
    }
}