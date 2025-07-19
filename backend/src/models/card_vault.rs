use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;
use std::str::FromStr;

/// RBI-compliant card vault entry (no sensitive data stored)
#[derive(Debug, FromRow, Serialize, Deserialize, Clone)]
pub struct CardVault {
    pub id: Uuid,
    pub user_id: Uuid,
    
    // Card identification
    pub bank_name: String,
    pub card_type: String,
    pub card_network: Option<String>,
    pub last_four_digits: Option<String>,
    pub nickname: Option<String>,
    
    // Reward structure
    pub base_reward_rate: BigDecimal,
    pub reward_type: String,
    pub point_value_inr: BigDecimal,
    
    // Category-specific rewards (JSON)
    pub category_rewards: JsonValue,
    
    // Milestone rewards
    pub current_points: i32,
    pub points_expiry_date: Option<NaiveDate>,
    pub milestone_config: JsonValue,
    
    // Card features
    pub features: JsonValue,
    pub annual_fee: BigDecimal,
    pub fee_waiver_criteria: Option<String>,
    
    // Bank-specific offers
    pub bank_offers: JsonValue,
    
    // Status
    pub is_active: bool,
    pub is_primary: bool,
    
    // Timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a new card in the vault
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCardRequest {
    pub bank_name: String,
    pub card_type: String,
    pub card_network: Option<String>,
    pub last_four_digits: Option<String>,
    pub nickname: Option<String>,
    
    pub base_reward_rate: Option<BigDecimal>,
    pub reward_type: Option<String>,
    pub point_value_inr: Option<BigDecimal>,
    
    pub category_rewards: Option<JsonValue>,
    pub current_points: Option<i32>,
    pub milestone_config: Option<JsonValue>,
    
    pub features: Option<JsonValue>,
    pub annual_fee: Option<BigDecimal>,
    pub fee_waiver_criteria: Option<String>,
}

/// Request to update card details
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCardRequest {
    pub nickname: Option<String>,
    pub current_points: Option<i32>,
    pub is_primary: Option<bool>,
    pub is_active: Option<bool>,
    pub category_rewards: Option<JsonValue>,
    pub milestone_config: Option<JsonValue>,
    pub bank_offers: Option<JsonValue>,
}

/// Card transaction for tracking rewards
#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct CardTransaction {
    pub id: Uuid,
    pub card_id: Uuid,
    pub transaction_date: NaiveDate,
    pub amount: BigDecimal,
    pub category: Option<String>,
    pub points_earned: i32,
    pub cashback_earned: BigDecimal,
    pub deal_id: Option<Uuid>,
    pub additional_discount: BigDecimal,
    pub created_at: DateTime<Utc>,
}

/// Card-specific offer
#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct CardOffer {
    pub id: Uuid,
    pub card_id: Uuid,
    pub offer_type: String,
    pub merchant_name: Option<String>,
    pub category: Option<String>,
    pub discount_percentage: Option<BigDecimal>,
    pub max_discount: Option<BigDecimal>,
    pub min_transaction: Option<BigDecimal>,
    pub valid_from: NaiveDate,
    pub valid_till: NaiveDate,
    pub terms_conditions: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

/// Smart deal ranking with card benefits
#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct SmartDealRanking {
    pub id: Uuid,
    pub user_id: Uuid,
    pub deal_id: Uuid,
    
    // Deal details
    pub original_price: BigDecimal,
    pub deal_discount: BigDecimal,
    
    // Card recommendation
    pub recommended_card_id: Option<Uuid>,
    pub card_benefit: BigDecimal,
    
    // Total savings
    pub total_savings: BigDecimal,
    pub effective_price: BigDecimal,
    pub savings_percentage: BigDecimal,
    
    // Additional benefits
    pub points_earned: i32,
    pub milestone_progress: Option<String>,
    
    pub ranking_score: BigDecimal,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

/// Deal ranking calculation request
#[derive(Debug, Serialize, Deserialize)]
pub struct CalculateDealRankingRequest {
    pub deal_id: Uuid,
    pub merchant_name: String,
    pub category: String,
    pub original_price: BigDecimal,
    pub deal_discount: BigDecimal,
}

/// Deal ranking response with card recommendation
#[derive(Debug, Serialize, Deserialize)]
pub struct DealRankingResponse {
    pub deal_id: Uuid,
    pub rankings: Vec<CardDealAnalysis>,
}

/// Analysis of a specific card for a deal
#[derive(Debug, Serialize, Deserialize)]
pub struct CardDealAnalysis {
    pub card_id: Uuid,
    pub card_name: String,
    pub bank_name: String,
    
    // Benefits breakdown
    pub base_reward: BigDecimal,
    pub category_bonus: BigDecimal,
    pub bank_offer_discount: BigDecimal,
    pub total_benefit: BigDecimal,
    
    // Final calculation
    pub effective_price: BigDecimal,
    pub total_savings: BigDecimal,
    pub savings_percentage: BigDecimal,
    
    // Additional perks
    pub points_earned: i32,
    pub points_value_inr: BigDecimal,
    pub milestone_progress: Option<MilestoneProgress>,
    
    // Ranking score (higher is better)
    pub score: BigDecimal,
}

/// Milestone progress information
#[derive(Debug, Serialize, Deserialize)]
pub struct MilestoneProgress {
    pub current_points: i32,
    pub points_after_purchase: i32,
    pub next_milestone: i32,
    pub milestone_value: BigDecimal,
    pub points_to_milestone: i32,
}

/// Popular card templates for quick addition
#[derive(Debug, Serialize, Deserialize)]
pub struct CardTemplate {
    pub bank_name: String,
    pub card_type: String,
    pub card_network: String,
    pub base_reward_rate: BigDecimal,
    pub reward_type: String,
    pub point_value_inr: BigDecimal,
    pub category_rewards: JsonValue,
    pub features: JsonValue,
    pub annual_fee: BigDecimal,
    pub fee_waiver_criteria: Option<String>,
}

/// Predefined card templates
impl CardTemplate {
    pub fn hdfc_infinia() -> Self {
        Self {
            bank_name: "HDFC".to_string(),
            card_type: "Infinia".to_string(),
            card_network: "Visa".to_string(),
            base_reward_rate: BigDecimal::from_str("3.3").unwrap(),
            reward_type: "points".to_string(),
            point_value_inr: BigDecimal::from(1),
            category_rewards: serde_json::json!({
                "flights": 5,
                "hotels": 5,
                "smartbuy": 16.5
            }),
            features: serde_json::json!({
                "lounge_access": true,
                "golf_access": true,
                "concierge": true,
                "insurance_cover": true
            }),
            annual_fee: BigDecimal::from(12500),
            fee_waiver_criteria: Some("Spend 10L in a year".to_string()),
        }
    }
    
    pub fn axis_magnus() -> Self {
        Self {
            bank_name: "Axis".to_string(),
            card_type: "Magnus".to_string(),
            card_network: "Mastercard".to_string(),
            base_reward_rate: BigDecimal::from_str("4.8").unwrap(),
            reward_type: "points".to_string(),
            point_value_inr: BigDecimal::from_str("0.2").unwrap(),
            category_rewards: serde_json::json!({
                "travel_edge": 5,
                "grab_deals": 5,
                "partner_merchants": 10
            }),
            features: serde_json::json!({
                "lounge_access": true,
                "meet_greet": true,
                "golf_access": true,
                "concierge": true
            }),
            annual_fee: BigDecimal::from(10000),
            fee_waiver_criteria: Some("Spend 15L in a year".to_string()),
        }
    }
    
    pub fn sbi_cashback() -> Self {
        Self {
            bank_name: "SBI".to_string(),
            card_type: "Cashback".to_string(),
            card_network: "Visa".to_string(),
            base_reward_rate: BigDecimal::from(5), // 5% cashback
            reward_type: "cashback".to_string(),
            point_value_inr: BigDecimal::from(1), // Direct cashback
            category_rewards: serde_json::json!({
                "online": 5,
                "offline": 1
            }),
            features: serde_json::json!({
                "fuel_surcharge_waiver": true,
                "no_forex_markup": false
            }),
            annual_fee: BigDecimal::from(999),
            fee_waiver_criteria: Some("Spend 2L in a year".to_string()),
        }
    }
}
