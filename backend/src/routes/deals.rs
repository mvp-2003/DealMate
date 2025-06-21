use axum::{extract::Query, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct DealQuery {
    pub product_url: String,
}

#[derive(Serialize)]
pub struct DealResponse {
    pub deals: Vec<Deal>,
    pub score: f64,
}

#[derive(Serialize)]
pub struct Deal {
    pub title: String,
    pub discount: f64,
    pub deal_type: String,
    pub description: String,
}

pub async fn get_deals(Query(_params): Query<DealQuery>) -> Result<Json<DealResponse>, StatusCode> {
    let deals = vec![
        Deal {
            title: "10% Cashback".to_string(),
            discount: 10.0,
            deal_type: "cashback".to_string(),
            description: "Get 10% cashback with your credit card".to_string(),
        },
        Deal {
            title: "5% Coupon".to_string(),
            discount: 5.0,
            deal_type: "coupon".to_string(),
            description: "Apply coupon code SAVE5".to_string(),
        },
    ];

    let score = deals.iter().map(|d| d.discount).sum::<f64>() / deals.len() as f64;

    Ok(Json(DealResponse { deals, score }))
}