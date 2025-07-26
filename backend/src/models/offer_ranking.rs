use serde::{Deserialize, Serialize};
use sqlx::types::{BigDecimal, chrono::{DateTime, Utc}};
use shared::models::deal::Deal;

#[derive(Debug, Serialize, Deserialize)]
pub struct RankedOffer {
    #[serde(flatten)]
    pub deal: Deal,
    pub ranking_score: f64,
    pub ranking_components: RankingComponents,
    pub personalization_data: PersonalizationData,
    pub stacking_opportunities: Vec<StackingOpportunity>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RankingComponents {
    pub net_savings_score: f64,
    pub cashback_realization_score: f64,
    pub reward_points_score: f64,
    pub threshold_proximity_score: f64,
    pub personal_preference_score: f64,
    pub urgency_score: f64,
    pub popularity_score: f64,
    pub stacking_potential_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PersonalizationData {
    pub user_category_affinity: f64,
    pub merchant_preference_score: f64,
    pub price_range_match: f64,
    pub payment_method_compatibility: f64,
    pub geographic_relevance: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StackingOpportunity {
    pub stack_type: StackType,
    pub additional_savings: BigDecimal,
    pub combined_offer_ids: Vec<i32>,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StackType {
    CouponPlusCashback,
    CardOfferPlusCoupon,
    BankOfferPlusWallet,
    MultipleCoupons,
    RewardPointsBonus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OfferRankingRequest {
    pub user_id: String,
    pub deals: Vec<i32>, // Deal IDs to rank
    pub user_location: Option<UserLocation>,
    pub preferred_payment_methods: Option<Vec<String>>,
    pub max_results: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserLocation {
    pub latitude: f64,
    pub longitude: f64,
    pub city: Option<String>,
    pub postal_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OfferRankingResponse {
    pub ranked_offers: Vec<RankedOffer>,
    pub total_count: i32,
    pub personalization_applied: bool,
    pub ranking_timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserPreferences {
    pub user_id: String,
    pub favorite_categories: Vec<String>,
    pub favorite_merchants: Vec<String>,
    pub typical_spend_range: SpendRange,
    pub preferred_cashback_types: Vec<CashbackType>,
    pub notification_preferences: NotificationPreferences,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpendRange {
    pub min_amount: BigDecimal,
    pub max_amount: BigDecimal,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CashbackType {
    Instant,
    Wallet,
    BankTransfer,
    RewardPoints,
    Vouchers,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationPreferences {
    pub threshold_alerts: bool,
    pub expiry_reminders: bool,
    pub new_offer_alerts: bool,
    pub price_drop_alerts: bool,
}

// Ranking algorithm implementation
impl RankedOffer {
    pub fn calculate_ranking(
        deal: Deal,
        user_prefs: &UserPreferences,
        user_activity: &UserActivity,
        weights: &RankingWeights,
    ) -> Self {
        let net_savings = calculate_net_savings(&deal);
        let cashback_time = calculate_cashback_realization_score(&deal);
        let reward_points = calculate_reward_points_value(&deal, user_prefs);
        let threshold_prox = calculate_threshold_proximity(&deal, user_activity);
        let personal_pref = calculate_personal_preference(&deal, user_prefs, user_activity);
        let urgency = calculate_urgency_score(&deal);
        let popularity = calculate_popularity_score(&deal);
        let stacking = calculate_stacking_potential(&deal);

        let ranking_components = RankingComponents {
            net_savings_score: normalize_score(net_savings),
            cashback_realization_score: cashback_time,
            reward_points_score: normalize_score(reward_points),
            threshold_proximity_score: threshold_prox,
            personal_preference_score: personal_pref,
            urgency_score: urgency,
            popularity_score: popularity,
            stacking_potential_score: stacking,
        };

        let ranking_score = 
            ranking_components.net_savings_score * weights.net_savings +
            ranking_components.cashback_realization_score * weights.cashback_realization +
            ranking_components.reward_points_score * weights.reward_points +
            ranking_components.threshold_proximity_score * weights.threshold_proximity +
            ranking_components.personal_preference_score * weights.personal_preference +
            ranking_components.urgency_score * weights.urgency +
            ranking_components.popularity_score * weights.popularity +
            ranking_components.stacking_potential_score * weights.stacking_potential;

        let personalization_data = PersonalizationData {
            user_category_affinity: calculate_category_affinity(&deal, user_prefs),
            merchant_preference_score: calculate_merchant_preference(&deal, user_prefs),
            price_range_match: calculate_price_range_match(&deal, user_prefs),
            payment_method_compatibility: 0.8, // Placeholder
            geographic_relevance: 0.9, // Placeholder
        };

        let stacking_opportunities = find_stacking_opportunities(&deal);

        RankedOffer {
            deal,
            ranking_score,
            ranking_components,
            personalization_data,
            stacking_opportunities,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RankingWeights {
    pub net_savings: f64,
    pub cashback_realization: f64,
    pub reward_points: f64,
    pub threshold_proximity: f64,
    pub personal_preference: f64,
    pub urgency: f64,
    pub popularity: f64,
    pub stacking_potential: f64,
}

impl Default for RankingWeights {
    fn default() -> Self {
        Self {
            net_savings: 0.4,
            cashback_realization: 0.2,
            reward_points: 0.1,
            threshold_proximity: 0.1,
            personal_preference: 0.1,
            urgency: 0.05,
            popularity: 0.05,
            stacking_potential: 0.0, // Can be adjusted based on user behavior
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserActivity {
    pub user_id: String,
    pub recent_purchases: Vec<Purchase>,
    pub browsing_history: Vec<BrowsingEvent>,
    pub saved_offers: Vec<i32>,
    pub redeemed_offers: Vec<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Purchase {
    pub merchant: String,
    pub category: String,
    pub amount: BigDecimal,
    pub currency: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BrowsingEvent {
    pub category: String,
    pub merchant: Option<String>,
    pub price_range: SpendRange,
    pub timestamp: DateTime<Utc>,
}

// Helper functions
fn calculate_net_savings(deal: &Deal) -> f64 {
    let discount_amount = deal.calculate_savings();
    let cashback_value = deal.cashback_rate
        .as_ref()
        .map(|rate| {
            let final_price = deal.get_final_price();
            &final_price * (rate / &BigDecimal::from(100))
        })
        .unwrap_or_else(|| BigDecimal::from(0));
    
    let total_savings = discount_amount + cashback_value;
    total_savings.to_string().parse::<f64>().unwrap_or(0.0)
}

fn calculate_cashback_realization_score(deal: &Deal) -> f64 {
    // Instant cashback gets highest score
    if deal.deal_type.as_deref() == Some("instant_cashback") {
        return 1.0;
    }
    
    // Wallet cashback within 24 hours
    if deal.deal_type.as_deref() == Some("wallet_cashback") {
        return 0.8;
    }
    
    // Bank transfer cashback (typically 7-30 days)
    if deal.deal_type.as_deref() == Some("bank_cashback") {
        return 0.5;
    }
    
    // Reward points or vouchers
    0.3
}

fn calculate_reward_points_value(
    deal: &Deal,
    user_prefs: &UserPreferences,
) -> f64 {
    // Placeholder implementation
    // In production, this would calculate actual point values based on user's card/loyalty programs
    0.0
}

fn calculate_threshold_proximity(
    deal: &Deal,
    user_activity: &UserActivity,
) -> f64 {
    // Calculate how close user is to bonus thresholds
    if let Some(min_order) = &deal.minimum_order_value {
        // Check if user's typical spend is close to threshold
        let typical_spend = calculate_typical_spend(user_activity);
        let threshold = min_order.to_string().parse::<f64>().unwrap_or(0.0);
        let spend = typical_spend.to_string().parse::<f64>().unwrap_or(0.0);
        
        if spend >= threshold * 0.8 && spend < threshold {
            return 0.9; // Very close to threshold
        }
    }
    0.0
}

fn calculate_personal_preference(
    deal: &Deal,
    user_prefs: &UserPreferences,
    user_activity: &UserActivity,
) -> f64 {
    let mut score = 0.0;
    
    // Category preference
    if let Some(category) = &deal.category {
        if user_prefs.favorite_categories.contains(category) {
            score += 0.4;
        }
    }
    
    // Merchant preference
    if user_prefs.favorite_merchants.contains(&deal.merchant) {
        score += 0.4;
    }
    
    // Recent activity boost
    let recent_category_activity = user_activity.browsing_history
        .iter()
        .filter(|event| {
            event.category == deal.category.as_deref().unwrap_or("")
        })
        .count() as f64;
    
    score += (recent_category_activity / 10.0).min(0.2);
    
    score
}

fn calculate_urgency_score(deal: &Deal) -> f64 {
    if let Some(days) = deal.days_until_expiry() {
        match days {
            0..=1 => 1.0,
            2..=3 => 0.8,
            4..=7 => 0.6,
            8..=14 => 0.4,
            _ => 0.2,
        }
    } else {
        0.1 // No expiry date
    }
}

fn calculate_popularity_score(deal: &Deal) -> f64 {
    let usage_score = (deal.usage_count as f64 / 1000.0).min(0.5);
    let success_rate_score = deal.success_rate
        .as_ref()
        .map(|rate| rate.to_string().parse::<f64>().unwrap_or(0.0) / 100.0 * 0.5)
        .unwrap_or(0.0);
    
    usage_score + success_rate_score
}

fn calculate_stacking_potential(deal: &Deal) -> f64 {
    // Check if deal can be combined with other offers
    let mut score = 0.0;
    
    // Has coupon code that might stack
    if deal.coupon_code.is_some() {
        score += 0.3;
    }
    
    // Has cashback that usually stacks
    if deal.cashback_rate.is_some() {
        score += 0.4;
    }
    
    // No minimum order requirement (easier to stack)
    if deal.minimum_order_value.is_none() {
        score += 0.3;
    }
    
    score
}

fn normalize_score(value: f64) -> f64 {
    // Normalize to 0-1 range using sigmoid function
    1.0 / (1.0 + (-value / 100.0).exp())
}

fn calculate_category_affinity(
    deal: &Deal,
    user_prefs: &UserPreferences,
) -> f64 {
    if let Some(category) = &deal.category {
        if user_prefs.favorite_categories.contains(category) {
            return 1.0;
        }
    }
    0.0
}

fn calculate_merchant_preference(
    deal: &Deal,
    user_prefs: &UserPreferences,
) -> f64 {
    if user_prefs.favorite_merchants.contains(&deal.merchant) {
        1.0
    } else {
        0.0
    }
}

fn calculate_price_range_match(
    deal: &Deal,
    user_prefs: &UserPreferences,
) -> f64 {
    let deal_price = deal.get_final_price();
    let min_pref = &user_prefs.typical_spend_range.min_amount;
    let max_pref = &user_prefs.typical_spend_range.max_amount;
    
    if &deal_price >= min_pref && &deal_price <= max_pref {
        1.0
    } else if &deal_price < min_pref {
        // Calculate how far below minimum
        let ratio = deal_price.to_string().parse::<f64>().unwrap_or(0.0) / 
                   min_pref.to_string().parse::<f64>().unwrap_or(1.0);
        ratio.max(0.0)
    } else {
        // Calculate how far above maximum
        let ratio = max_pref.to_string().parse::<f64>().unwrap_or(0.0) / 
                   deal_price.to_string().parse::<f64>().unwrap_or(1.0);
        ratio.max(0.0)
    }
}

fn calculate_typical_spend(user_activity: &UserActivity) -> BigDecimal {
    if user_activity.recent_purchases.is_empty() {
        return BigDecimal::from(0);
    }
    
    let total: BigDecimal = user_activity.recent_purchases
        .iter()
        .map(|p| &p.amount)
        .fold(BigDecimal::from(0), |acc, amount| acc + amount);
    
    total / BigDecimal::from(user_activity.recent_purchases.len() as i64)
}

fn find_stacking_opportunities(deal: &Deal) -> Vec<StackingOpportunity> {
    // Placeholder - in production, this would query compatible offers
    vec![]
}
