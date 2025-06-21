use axum::{extract::Query, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct DealQuery {
    pub product_url: String,
}

#[derive(Deserialize)]
pub struct ProductDetectionRequest {
    pub product: ProductInfo,
    pub deals: DetectedDeals,
    pub timestamp: u64,
}

#[derive(Deserialize)]
pub struct ProductInfo {
    #[serde(rename = "productName")]
    pub product_name: String,
    pub price: String,
    #[serde(rename = "originalPrice")]
    pub original_price: Option<String>,
    pub discount: Option<String>,
    pub image: String,
    pub platform: String,
    pub url: String,
}

#[derive(Deserialize)]
pub struct DetectedDeals {
    pub coupons: Vec<CouponInfo>,
    pub offers: Vec<OfferInfo>,
}

#[derive(Deserialize)]
pub struct CouponInfo {
    pub text: String,
    #[serde(rename = "type")]
    pub coupon_type: String,
    pub value: String,
}

#[derive(Deserialize)]
pub struct OfferInfo {
    pub text: String,
    #[serde(rename = "type")]
    pub offer_type: String,
    pub value: String,
}

#[derive(Serialize)]
pub struct DealResponse {
    pub deals: Vec<Deal>,
    pub score: f64,
    pub message: String,
}

#[derive(Serialize)]
pub struct ProductDetectionResponse {
    pub status: String,
    pub message: String,
    pub enhanced_deals: Vec<Deal>,
    pub savings_potential: f64,
}

#[derive(Serialize)]
pub struct Deal {
    pub title: String,
    pub discount: f64,
    pub deal_type: String,
    pub description: String,
    pub confidence: f64,
}

pub async fn get_deals(Query(_params): Query<DealQuery>) -> Result<Json<DealResponse>, StatusCode> {
    let deals = vec![
        Deal {
            title: "10% Cashback".to_string(),
            discount: 10.0,
            deal_type: "cashback".to_string(),
            description: "Get 10% cashback with your credit card".to_string(),
            confidence: 0.9,
        },
        Deal {
            title: "5% Coupon".to_string(),
            discount: 5.0,
            deal_type: "coupon".to_string(),
            description: "Apply coupon code SAVE5".to_string(),
            confidence: 0.8,
        },
    ];

    let score = deals.iter().map(|d| d.discount).sum::<f64>() / deals.len() as f64;

    Ok(Json(DealResponse { 
        deals, 
        score,
        message: "Deals fetched successfully".to_string(),
    }))
}

pub async fn handle_product_detection(
    Json(payload): Json<ProductDetectionRequest>,
) -> Result<Json<ProductDetectionResponse>, StatusCode> {
    println!("🎯 Backend: Product detected - {}", payload.product.product_name);
    println!("🎯 Backend: Found {} coupons, {} offers", 
             payload.deals.coupons.len(), 
             payload.deals.offers.len());
    
    // Analyze detected deals and enhance them
    let mut enhanced_deals = Vec::new();
    
    // Process coupons
    for coupon in &payload.deals.coupons {
        let discount = extract_discount_value(&coupon.value);
        enhanced_deals.push(Deal {
            title: format!("Coupon: {}", coupon.value),
            discount,
            deal_type: "coupon".to_string(),
            description: coupon.text.clone(),
            confidence: calculate_confidence(&coupon.text),
        });
    }
    
    // Process offers
    for offer in &payload.deals.offers {
        let discount = extract_discount_value(&offer.value);
        enhanced_deals.push(Deal {
            title: format!("Offer: {}", offer.value),
            discount,
            deal_type: "offer".to_string(),
            description: offer.text.clone(),
            confidence: calculate_confidence(&offer.text),
        });
    }
    
    // Add platform-specific deals
    let platform_deals = get_platform_specific_deals(&payload.product.platform);
    enhanced_deals.extend(platform_deals);
    
    let savings_potential = enhanced_deals.iter()
        .map(|d| d.discount * d.confidence)
        .sum::<f64>();
    
    Ok(Json(ProductDetectionResponse {
        status: "success".to_string(),
        message: format!("Processed {} deals for {}", 
                        enhanced_deals.len(), 
                        payload.product.product_name),
        enhanced_deals,
        savings_potential,
    }))
}

fn extract_discount_value(value: &str) -> f64 {
    // Extract percentage
    if let Some(caps) = regex::Regex::new(r"(\d+)%").unwrap().captures(value) {
        return caps[1].parse::<f64>().unwrap_or(0.0);
    }
    
    // Extract rupee amount
    if let Some(caps) = regex::Regex::new(r"₹\s*(\d+)").unwrap().captures(value) {
        return caps[1].parse::<f64>().unwrap_or(0.0);
    }
    
    // Extract dollar amount
    if let Some(caps) = regex::Regex::new(r"\$\s*(\d+)").unwrap().captures(value) {
        return caps[1].parse::<f64>().unwrap_or(0.0);
    }
    
    5.0 // Default discount
}

fn calculate_confidence(text: &str) -> f64 {
    let text_lower = text.to_lowercase();
    
    if text_lower.contains("limited time") || text_lower.contains("expires") {
        0.9
    } else if text_lower.contains("coupon") || text_lower.contains("code") {
        0.8
    } else if text_lower.contains("save") || text_lower.contains("off") {
        0.7
    } else {
        0.6
    }
}

fn get_platform_specific_deals(platform: &str) -> Vec<Deal> {
    match platform.to_lowercase().as_str() {
        p if p.contains("amazon") => vec![
            Deal {
                title: "Amazon Prime Member Deal".to_string(),
                discount: 5.0,
                deal_type: "membership".to_string(),
                description: "Additional 5% off for Prime members".to_string(),
                confidence: 0.7,
            }
        ],
        p if p.contains("flipkart") => vec![
            Deal {
                title: "Flipkart Plus Benefits".to_string(),
                discount: 3.0,
                deal_type: "membership".to_string(),
                description: "Early access and free delivery".to_string(),
                confidence: 0.6,
            }
        ],
        _ => vec![]
    }
}