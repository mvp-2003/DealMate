use axum::{
    extract::{Query, FromRequestParts},
    http::{HeaderMap, StatusCode, request::Parts},
    response::{IntoResponse, Redirect},
    Json,
    async_trait,
};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use once_cell::sync::Lazy;
use crate::models::user::User;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub exp: usize,
    pub iat: usize,
}

// AuthUser extractor for authenticated routes
#[derive(Debug, Clone)]
pub struct AuthUser(pub User);

#[async_trait]
impl FromRequestParts<PgPool> for AuthUser
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &PgPool) -> Result<Self, Self::Rejection> {
        // Get claims from request extensions (set by auth middleware)
        let claims = parts
            .extensions
            .get::<Claims>()
            .ok_or(StatusCode::UNAUTHORIZED)?
            .clone();

        let pool = state.clone();

        // Look up user by Auth0 ID
        let user = sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE auth0_id = $1",
            claims.sub
        )
        .fetch_optional(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        match user {
            Some(user) => Ok(AuthUser(user)),
            None => {
                // Create user if not exists
                let user_id = Uuid::new_v4();
                let now = chrono::Utc::now().naive_utc();
                
                let user = sqlx::query_as!(
                    User,
                    r#"
                    INSERT INTO users (id, auth0_id, username, email, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                    "#,
                    user_id,
                    claims.sub,
                    claims.name.clone().unwrap_or_else(|| claims.email.clone().unwrap_or_else(|| "user".to_string())),
                    claims.email,
                    now,
                    now
                )
                .fetch_one(&pool)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

                Ok(AuthUser(user))
            }
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct AuthQuery {
    code: Option<String>,
    #[allow(dead_code)]
    state: Option<String>,
    connection: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    access_token: String,
    id_token: String,
    token_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JWK {
    kty: String,
    kid: String,
    #[serde(rename = "use")]
    key_use: String,
    n: String,
    e: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JWKS {
    keys: Vec<JWK>,
}

static JWKS_CACHE: Lazy<tokio::sync::RwLock<Option<JWKS>>> = Lazy::new(|| {
    tokio::sync::RwLock::new(None)
});

pub async fn login_handler(Query(params): Query<AuthQuery>) -> impl IntoResponse {
    let auth0_domain = std::env::var("AUTH0_DOMAIN").expect("AUTH0_DOMAIN must be set");
    let client_id = std::env::var("AUTH0_CLIENT_ID").expect("AUTH0_CLIENT_ID must be set");
    let audience = std::env::var("AUTH0_AUDIENCE").expect("AUTH0_AUDIENCE must be set");
    let redirect_uri = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string()) + "/auth/callback";
    
    let mut auth_url = format!(
        "https://{}/authorize?response_type=code&client_id={}&redirect_uri={}&scope=openid profile email&audience={}",
        auth0_domain, client_id, redirect_uri, audience
    );
    
    // Add connection parameter for social logins
    if let Some(connection) = params.connection {
        auth_url = format!("{}&connection={}", auth_url, connection);
    }
    
    Redirect::temporary(&auth_url)
}

pub async fn signup_handler(Query(params): Query<AuthQuery>) -> impl IntoResponse {
    let auth0_domain = std::env::var("AUTH0_DOMAIN").expect("AUTH0_DOMAIN must be set");
    let client_id = std::env::var("AUTH0_CLIENT_ID").expect("AUTH0_CLIENT_ID must be set");
    let audience = std::env::var("AUTH0_AUDIENCE").expect("AUTH0_AUDIENCE must be set");
    let redirect_uri = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string()) + "/auth/callback";
    
    let mut auth_url = format!(
        "https://{}/authorize?response_type=code&client_id={}&redirect_uri={}&scope=openid profile email&audience={}&screen_hint=signup",
        auth0_domain, client_id, redirect_uri, audience
    );
    
    // Add connection parameter for social logins
    if let Some(connection) = params.connection {
        auth_url = format!("{}&connection={}", auth_url, connection);
    }
    
    Redirect::temporary(&auth_url)
}

pub async fn callback_handler(Query(params): Query<AuthQuery>) -> impl IntoResponse {
    let code = match params.code {
        Some(code) => code,
        None => return (StatusCode::BAD_REQUEST, "Missing authorization code").into_response(),
    };

    match exchange_code_for_token(&code).await {
        Ok(token_response) => {
            let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
            let redirect_url = format!("{}/auth?token={}", frontend_url, token_response.access_token);
            Redirect::temporary(&redirect_url).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Token exchange failed").into_response(),
    }
}

pub async fn logout_handler() -> impl IntoResponse {
    let auth0_domain = std::env::var("AUTH0_DOMAIN").expect("AUTH0_DOMAIN must be set");
    let client_id = std::env::var("AUTH0_CLIENT_ID").expect("AUTH0_CLIENT_ID must be set");
    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    
    let logout_url = format!(
        "https://{}/v2/logout?client_id={}&returnTo={}",
        auth0_domain, client_id, frontend_url
    );
    
    Redirect::temporary(&logout_url)
}

async fn exchange_code_for_token(code: &str) -> Result<TokenResponse, Box<dyn std::error::Error>> {
    let auth0_domain = std::env::var("AUTH0_DOMAIN")?;
    let client_id = std::env::var("AUTH0_CLIENT_ID")?;
    let redirect_uri = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string()) + "/auth/callback";

    let client = Client::new();
    let mut params = HashMap::new();
    params.insert("grant_type", "authorization_code");
    params.insert("client_id", &client_id);
    params.insert("code", code);
    params.insert("redirect_uri", &redirect_uri);

    let response = client
        .post(&format!("https://{}/oauth/token", auth0_domain))
        .form(&params)
        .send()
        .await?;

    let token_response: TokenResponse = response.json().await?;
    Ok(token_response)
}

pub async fn verify_token(token: &str) -> Result<Claims, Box<dyn std::error::Error>> {
    let header = decode_header(token)?;
    let kid = header.kid.ok_or("Missing kid in token header")?;
    
    let jwks = get_jwks().await?;
    let jwk = jwks.keys.iter().find(|k| k.kid == kid)
        .ok_or("JWK not found")?;
    
    let decoding_key = DecodingKey::from_rsa_components(&jwk.n, &jwk.e)?;
    let mut validation = Validation::new(Algorithm::RS256);
    let audience = std::env::var("AUTH0_AUDIENCE")?;
    validation.set_audience(&[audience]);
    validation.set_issuer(&[format!("https://{}/", std::env::var("AUTH0_DOMAIN")?)]);
    
    let token_data = decode::<Claims>(token, &decoding_key, &validation)?;
    Ok(token_data.claims)
}

async fn get_jwks() -> Result<JWKS, Box<dyn std::error::Error>> {
    {
        let cache = JWKS_CACHE.read().await;
        if let Some(jwks) = cache.as_ref() {
            return Ok(jwks.clone());
        }
    }
    
    let auth0_domain = std::env::var("AUTH0_DOMAIN")?;
    let client = Client::new();
    let response = client
        .get(&format!("https://{}/.well-known/jwks.json", auth0_domain))
        .send()
        .await?;
    
    let jwks: JWKS = response.json().await?;
    
    {
        let mut cache = JWKS_CACHE.write().await;
        *cache = Some(jwks.clone());
    }
    
    Ok(jwks)
}

pub async fn protected_handler(headers: HeaderMap) -> impl IntoResponse {
    let auth_header = match headers.get("authorization") {
        Some(header) => header.to_str().unwrap_or(""),
        None => return (StatusCode::UNAUTHORIZED, "Missing authorization header").into_response(),
    };

    let token = auth_header.strip_prefix("Bearer ").unwrap_or("");
    
    match verify_token(token).await {
        Ok(claims) => Json(claims).into_response(),
        Err(_) => (StatusCode::UNAUTHORIZED, "Invalid token").into_response(),
    }
}
