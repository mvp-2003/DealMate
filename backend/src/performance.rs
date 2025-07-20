use axum::{
    extract::Request,
    http::{HeaderValue, header},
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use tower_http::compression::{CompressionLayer, CompressionLevel};
use tower_http::set_header::SetResponseHeaderLayer;
use tracing::{debug, warn};

// Performance middleware for request timing and caching headers
pub async fn performance_middleware(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    // Execute the request
    let mut response = next.run(request).await;
    
    let duration = start.elapsed();
    debug!("Request {} {} took {:?}", method, uri, duration);
    
    // Warn about slow requests
    if duration.as_millis() > 1000 {
        warn!("Slow request detected: {} {} took {:?}", method, uri, duration);
    }
    
    // Add performance headers
    response.headers_mut().insert(
        header::HeaderName::from_static("x-response-time"),
        HeaderValue::from_str(&format!("{}ms", duration.as_millis()))
            .unwrap_or_else(|_| HeaderValue::from_static("0ms")),
    );
    
    // Add caching headers for GET requests
    if method == axum::http::Method::GET {
        // Cache static content for 24 hours
        if uri.path().contains("/api/") {
            response.headers_mut().insert(
                header::CACHE_CONTROL,
                HeaderValue::from_static("public, max-age=300"), // 5 minutes for API responses
            );
        } else {
            response.headers_mut().insert(
                header::CACHE_CONTROL,
                HeaderValue::from_static("public, max-age=86400"), // 24 hours for static content
            );
        }
    }
    
    response
}

// Create compression layer with optimal settings
pub fn create_compression_layer() -> CompressionLayer {
    CompressionLayer::new()
        .gzip(true)
        .quality(CompressionLevel::Default)
}

// Create performance headers layer
pub fn create_performance_headers_layer() -> SetResponseHeaderLayer<HeaderValue> {
    SetResponseHeaderLayer::overriding(
        header::HeaderName::from_static("x-powered-by"),
        HeaderValue::from_static("DealPal-Rust"),
    )
}
