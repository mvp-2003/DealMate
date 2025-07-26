use axum::{
    extract::{Extension, Query},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use crate::models::offer_ranking::{
    OfferRankingRequest, OfferRankingResponse, RankedOffer,
    RankingWeights, UserPreferences, UserActivity, Purchase,
    BrowsingEvent, SpendRange, CashbackType, NotificationPreferences,
};
use crate::auth::Claims;
use shared::models::deal::Deal;
use sqlx::types::{BigDecimal, chrono::Utc};

pub fn offer_ranking_routes(pool: PgPool) -> Router {
    Router::new()
        .route("/rank", post(rank_offers))
        .route("/preferences", get(get_user_preferences).post(update_user_preferences))
        .route("/weights", get(get_ranking_weights).post(update_ranking_weights))
        .route("/activity", get(get_user_activity))
        .layer(Extension(pool))
}

async fn rank_offers(
    Extension(pool): Extension<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<OfferRankingRequest>,
) -> Result<Json<OfferRankingResponse>, StatusCode> {
    // Validate user matches request
    if claims.sub != request.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    // Fetch deals
    let deals = fetch_deals_by_ids(&pool, &request.deals).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Fetch user preferences
    let user_prefs = fetch_user_preferences(&pool, &request.user_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .unwrap_or_else(|| create_default_preferences(&request.user_id));

    // Fetch user activity
    let user_activity = fetch_user_activity(&pool, &request.user_id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .unwrap_or_else(|| create_empty_activity(&request.user_id));

    // Get ranking weights (could be customized per user in the future)
    let weights = RankingWeights::default();

    // Rank offers
    let mut ranked_offers: Vec<RankedOffer> = deals
        .into_iter()
        .map(|deal| RankedOffer::calculate_ranking(deal, &user_prefs, &user_activity, &weights))
        .collect();

    // Sort by ranking score (descending)
    ranked_offers.sort_by(|a, b| b.ranking_score.partial_cmp(&a.ranking_score).unwrap());

    // Apply max results limit if specified
    if let Some(max) = request.max_results {
        ranked_offers.truncate(max as usize);
    }

    let response = OfferRankingResponse {
        total_count: ranked_offers.len() as i32,
        ranked_offers,
        personalization_applied: true,
        ranking_timestamp: Utc::now(),
    };

    Ok(Json(response))
}

async fn get_user_preferences(
    Extension(pool): Extension<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<UserPreferences>, StatusCode> {
    let prefs = fetch_user_preferences(&pool, &claims.sub).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .unwrap_or_else(|| create_default_preferences(&claims.sub));

    Ok(Json(prefs))
}

async fn update_user_preferences(
    Extension(pool): Extension<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(preferences): Json<UserPreferences>,
) -> Result<StatusCode, StatusCode> {
    if claims.sub != preferences.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    save_user_preferences(&pool, &preferences).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

async fn get_ranking_weights(
    Extension(pool): Extension<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<RankingWeights>, StatusCode> {
    // For now, return default weights
    // In the future, could have user-specific or A/B tested weights
    Ok(Json(RankingWeights::default()))
}

async fn update_ranking_weights(
    Extension(pool): Extension<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(weights): Json<RankingWeights>,
) -> Result<StatusCode, StatusCode> {
    // Only allow admin users to update weights
    // For now, just return OK
    // TODO: Implement admin check and weight persistence
    Ok(StatusCode::OK)
}

async fn get_user_activity(
    Extension(pool): Extension<PgPool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<UserActivity>, StatusCode> {
    let activity = fetch_user_activity(&pool, &claims.sub).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .unwrap_or_else(|| create_empty_activity(&claims.sub));

    Ok(Json(activity))
}

// Database helper functions
async fn fetch_deals_by_ids(
    pool: &PgPool,
    ids: &[i32],
) -> Result<Vec<Deal>, sqlx::Error> {
    // Convert Vec<i32> to a comma-separated string for SQL IN clause
    let id_list = ids.iter()
        .map(|id| id.to_string())
        .collect::<Vec<_>>()
        .join(",");

    // Use raw SQL since sqlx doesn't support dynamic IN clauses well
    let query = format!(
        "SELECT id, external_id, title, description, original_price, discounted_price, discount_percentage, currency, product_url, image_url, merchant, category, deal_type::TEXT as deal_type, coupon_code, cashback_rate, minimum_order_value, maximum_discount, valid_from, valid_until, is_active, is_verified, verification_date, usage_count, success_rate, tags, created_at, updated_at FROM deals WHERE id IN ({}) AND is_active = true",
        id_list
    );

    let deals = sqlx::query_as::<_, Deal>(&query)
        .fetch_all(pool)
        .await?;

    Ok(deals)
}

async fn fetch_user_preferences(
    pool: &PgPool,
    user_id: &str,
) -> Result<Option<UserPreferences>, sqlx::Error> {
    // TODO: Implement actual database query
    // For now, return None to use defaults
    Ok(None)
}

async fn save_user_preferences(
    pool: &PgPool,
    preferences: &UserPreferences,
) -> Result<(), sqlx::Error> {
    // TODO: Implement actual database save
    Ok(())
}

async fn fetch_user_activity(
    pool: &PgPool,
    user_id: &str,
) -> Result<Option<UserActivity>, sqlx::Error> {
    // TODO: Implement actual database query
    // This would aggregate from multiple tables:
    // - purchases table
    // - browsing_events table
    // - saved_offers table
    // - redeemed_offers table
    Ok(None)
}

// Helper functions to create default/empty data
fn create_default_preferences(user_id: &str) -> UserPreferences {
    UserPreferences {
        user_id: user_id.to_string(),
        favorite_categories: vec![],
        favorite_merchants: vec![],
        typical_spend_range: SpendRange {
            min_amount: BigDecimal::from(0),
            max_amount: BigDecimal::from(5000),
            currency: "INR".to_string(),
        },
        preferred_cashback_types: vec![
            CashbackType::Instant,
            CashbackType::Wallet,
        ],
        notification_preferences: NotificationPreferences {
            threshold_alerts: true,
            expiry_reminders: true,
            new_offer_alerts: true,
            price_drop_alerts: true,
        },
    }
}

fn create_empty_activity(user_id: &str) -> UserActivity {
    UserActivity {
        user_id: user_id.to_string(),
        recent_purchases: vec![],
        browsing_history: vec![],
        saved_offers: vec![],
        redeemed_offers: vec![],
    }
}
