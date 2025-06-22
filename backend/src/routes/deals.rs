use axum::{http::StatusCode, response::Json};
use serde::{Deserialize, Serialize};
use crate::pricer::{self, PricePredictionRequest, PricePredictionResponse};
use crate::stacksmart::{StackDealsRequest, StackedDealResult, ValidateStackRequest, ValidateStackResponse, StackSmartEngine};
use crate::analyzer::{ProductAnalysisRequest, ProductAnalysisResponse, ProductAnalyzer};

#[derive(Serialize, Deserialize)]
pub struct Deal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub price: f64,
    pub url: String,
}

pub async fn get_deals() -> Json<Vec<Deal>> {
    let deals = vec![
        Deal {
            id: "1".to_string(),
            title: "Example Deal 1".to_string(),
            description: "This is a great deal!".to_string(),
            price: 99.99,
            url: "https://example.com/deal1".to_string(),
        },
        Deal {
            id: "2".to_string(),
            title: "Example Deal 2".to_string(),
            description: "Another amazing deal!".to_string(),
            price: 49.99,
            url: "https://example.com/deal2".to_string(),
        },
    ];
    Json(deals)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProductDetectionRequest {
    pub url: String,
    pub html_content: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProductDetectionResponse {
    pub is_product_page: bool,
    pub product_details: Option<ProductDetails>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProductDetails {
    pub name: String,
    pub price: f64,
    pub currency: String,
}

pub async fn handle_product_detection(
    Json(payload): Json<ProductDetectionRequest>,
) -> (StatusCode, Json<ProductDetectionResponse>) {
    // Basic logic to check for "product" in the URL
    let is_product_page = payload.url.contains("product");

    let product_details = if is_product_page {
        Some(ProductDetails {
            name: "Sample Product".to_string(),
            price: 123.45,
            currency: "USD".to_string(),
        })
    } else {
        None
    };

    let response = ProductDetectionResponse {
        is_product_page,
        product_details,
    };

    (StatusCode::OK, Json(response))
}

pub async fn predict_price_handler(
    Json(payload): Json<PricePredictionRequest>,
) -> (StatusCode, Json<PricePredictionResponse>) {
    let response = pricer::predict_price(payload);
    (StatusCode::OK, Json(response))
}

pub async fn stack_deals_handler(
    Json(payload): Json<StackDealsRequest>,
) -> (StatusCode, Json<StackedDealResult>) {
    let engine = StackSmartEngine::new();
    let response = engine.optimize_deals(payload).await;
    (StatusCode::OK, Json(response))
}

pub async fn validate_stack_handler(
    Json(payload): Json<ValidateStackRequest>,
) -> (StatusCode, Json<ValidateStackResponse>) {
    let engine = StackSmartEngine::new();
    let response = engine.validate_deal_stack(payload).await;
    (StatusCode::OK, Json(response))
}

pub async fn analyze_product_handler(
    Json(payload): Json<ProductAnalysisRequest>,
) -> (StatusCode, Json<ProductAnalysisResponse>) {
    let analyzer = ProductAnalyzer::new();
    let response = analyzer.analyze_product_page(payload).await;
    (StatusCode::OK, Json(response))
}
