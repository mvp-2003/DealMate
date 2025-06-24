use axum::{http::StatusCode, response::Json};
use serde::{Deserialize, Serialize};
use crate::pricer::{self, PricePredictionRequest, PricePredictionResponse};
use crate::stacksmart::{StackDealsRequest, StackedDealResult, ValidateStackRequest, ValidateStackResponse, StackSmartEngine};
use crate::analyzer::{ProductAnalysisRequest, ProductAnalysisResponse, ProductAnalyzer};
use reqwest;

#[derive(Serialize, Deserialize)]
pub struct Deal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub price: f64,
    pub url: String,
}

pub async fn get_deals() -> Json<Vec<Deal>> {
    let client = reqwest::Client::new();
    let res = client
        .get("http://localhost:8001/get-real-time-deals")
        .send()
        .await
        .unwrap()
        .json::<Vec<Deal>>()
        .await
        .unwrap();
    Json(res)
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
