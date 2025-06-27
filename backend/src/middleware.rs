use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use crate::auth::verify_token;

pub async fn auth_middleware(
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = verify_token(token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    request.extensions_mut().insert(claims);
    Ok(next.run(request).await)
}