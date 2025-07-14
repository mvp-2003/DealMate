use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use shared::models::deal::{
    CreateDealRequest, Deal, DealSearchRequest, DealSearchResponse,
};

pub fn deals_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/", post(create_deal).get(search_deals))
        .route("/:id", get(get_deal))
        .route("/merchant/:merchant", get(get_coupons_by_merchant))
        .route("/submit", post(submit_coupon))
        .layer(Extension(pool))
}

async fn create_deal(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CreateDealRequest>,
) -> Result<Json<Deal>, StatusCode> {
    match Deal::create(&pool, payload).await {
        Ok(deal) => Ok(Json(deal)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_deal(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<Deal>, StatusCode> {
    match Deal::find_by_id(&pool, id).await {
        Ok(Some(deal)) => Ok(Json(deal)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn search_deals(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<DealSearchRequest>,
) -> Result<Json<DealSearchResponse>, StatusCode> {
    match Deal::search(&pool, params).await {
        Ok(response) => Ok(Json(response)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_coupons_by_merchant(
    Extension(pool): Extension<PgPool>,
    Path(merchant): Path<String>,
) -> Result<Json<Vec<Deal>>, StatusCode> {
    let search_request = DealSearchRequest {
        query: None,
        category: None,
        merchant: Some(merchant),
        min_discount: None,
        max_price: None,
        currency: None,
        only_active: Some(true),
        only_verified: Some(true),
        limit: Some(100),
        offset: Some(0),
    };

    match Deal::search(&pool, search_request).await {
        Ok(response) => Ok(Json(response.deals)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn submit_coupon(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CreateDealRequest>,
) -> Result<Json<Deal>, StatusCode> {
    // In a real application, you'd have more validation and security here.
    // For example, you might want to check if the user is logged in,
    // and you might want to have a system to prevent spam.
    match Deal::create(&pool, payload).await {
        Ok(deal) => Ok(Json(deal)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
