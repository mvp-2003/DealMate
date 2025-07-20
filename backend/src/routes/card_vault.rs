use axum::{
    extract::{Path, State, Json},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use bigdecimal::BigDecimal;
use chrono::Utc;
use serde_json::json;
use std::str::FromStr;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::card_vault::{
    CardVault, CreateCardRequest, UpdateCardRequest, 
    CalculateDealRankingRequest, DealRankingResponse,
    CardDealAnalysis, MilestoneProgress, CardTemplate
};

/// Get all cards for the authenticated user
pub async fn get_user_cards(
    user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<CardVault>>, AppError> {
    let rows = sqlx::query!(
        r#"
        SELECT * FROM card_vault
        WHERE user_id = $1 AND is_active = true
        ORDER BY is_primary DESC, created_at DESC
        "#,
        user.0.id
    )
    .fetch_all(&pool)
    .await?;

    let cards: Vec<CardVault> = rows.into_iter().map(|row| CardVault {
        id: row.id,
        user_id: row.user_id,
        bank_name: row.bank_name,
        card_type: row.card_type,
        card_network: row.card_network,
        last_four_digits: row.last_four_digits,
        nickname: row.nickname,
        base_reward_rate: row.base_reward_rate.unwrap_or(BigDecimal::from(0)),
        reward_type: row.reward_type.unwrap_or("points".to_string()),
        point_value_inr: row.point_value_inr.unwrap_or(BigDecimal::from(0)),
        category_rewards: row.category_rewards.unwrap_or(json!({})),
        current_points: row.current_points.unwrap_or(0),
        points_expiry_date: row.points_expiry_date,
        milestone_config: row.milestone_config.unwrap_or(json!([])),
        features: row.features.unwrap_or(json!({})),
        annual_fee: row.annual_fee.unwrap_or(BigDecimal::from(0)),
        fee_waiver_criteria: row.fee_waiver_criteria,
        bank_offers: row.bank_offers.unwrap_or(json!([])),
        is_active: row.is_active.unwrap_or(true),
        is_primary: row.is_primary.unwrap_or(false),
        created_at: row.created_at,
        updated_at: row.updated_at,
    }).collect();

    Ok(Json(cards))
}

/// Get a specific card by ID
pub async fn get_card(
    Path(card_id): Path<Uuid>,
    user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<CardVault>, AppError> {
    let row = sqlx::query!(
        r#"
        SELECT * FROM card_vault
        WHERE id = $1 AND user_id = $2
        "#,
        card_id,
        user.0.id
    )
    .fetch_optional(&pool)
    .await?;

    match row {
        Some(row) => {
            let card = CardVault {
                id: row.id,
                user_id: row.user_id,
                bank_name: row.bank_name,
                card_type: row.card_type,
                card_network: row.card_network,
                last_four_digits: row.last_four_digits,
                nickname: row.nickname,
                base_reward_rate: row.base_reward_rate.unwrap_or(BigDecimal::from(0)),
                reward_type: row.reward_type.unwrap_or("points".to_string()),
                point_value_inr: row.point_value_inr.unwrap_or(BigDecimal::from(0)),
                category_rewards: row.category_rewards.unwrap_or(json!({})),
                current_points: row.current_points.unwrap_or(0),
                points_expiry_date: row.points_expiry_date,
                milestone_config: row.milestone_config.unwrap_or(json!([])),
                features: row.features.unwrap_or(json!({})),
                annual_fee: row.annual_fee.unwrap_or(BigDecimal::from(0)),
                fee_waiver_criteria: row.fee_waiver_criteria,
                bank_offers: row.bank_offers.unwrap_or(json!([])),
                is_active: row.is_active.unwrap_or(true),
                is_primary: row.is_primary.unwrap_or(false),
                created_at: row.created_at,
                updated_at: row.updated_at,
            };
            Ok(Json(card))
        },
        None => Err(AppError::NotFound("Card not found".to_string())),
    }
}

/// Create a new card
pub async fn create_card(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(req): Json<CreateCardRequest>,
) -> Result<impl IntoResponse, AppError> {
    let card_id = Uuid::new_v4();
    let now = Utc::now();
    
    // Check if this is the user's first card
    let card_count: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM card_vault WHERE user_id = $1",
        user.0.id
    )
    .fetch_one(&pool)
    .await?
    .unwrap_or(0);
    
    let is_primary = card_count == 0;
    
    let row = sqlx::query!(
        r#"
        INSERT INTO card_vault (
            id, user_id, bank_name, card_type, card_network,
            last_four_digits, nickname,
            base_reward_rate, reward_type, point_value_inr,
            category_rewards, current_points, milestone_config,
            features, annual_fee, fee_waiver_criteria,
            is_primary, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING *
        "#,
        card_id,
        user.0.id,
        req.bank_name,
        req.card_type,
        req.card_network,
        req.last_four_digits,
        req.nickname,
        req.base_reward_rate.clone().unwrap_or(BigDecimal::from(0)),
        req.reward_type.clone().unwrap_or("points".to_string()),
        req.point_value_inr.clone().unwrap_or(BigDecimal::from(0)),
        req.category_rewards.clone().unwrap_or(json!({})),
        req.current_points.unwrap_or(0),
        req.milestone_config.clone().unwrap_or(json!([])),
        req.features.clone().unwrap_or(json!({})),
        req.annual_fee.clone().unwrap_or(BigDecimal::from(0)),
        req.fee_waiver_criteria,
        is_primary,
        now,
        now
    )
    .fetch_one(&pool)
    .await?;

    let card = CardVault {
        id: row.id,
        user_id: row.user_id,
        bank_name: row.bank_name,
        card_type: row.card_type,
        card_network: row.card_network,
        last_four_digits: row.last_four_digits,
        nickname: row.nickname,
        base_reward_rate: row.base_reward_rate.unwrap_or(BigDecimal::from(0)),
        reward_type: row.reward_type.unwrap_or("points".to_string()),
        point_value_inr: row.point_value_inr.unwrap_or(BigDecimal::from(0)),
        category_rewards: row.category_rewards.unwrap_or(json!({})),
        current_points: row.current_points.unwrap_or(0),
        points_expiry_date: row.points_expiry_date,
        milestone_config: row.milestone_config.unwrap_or(json!([])),
        features: row.features.unwrap_or(json!({})),
        annual_fee: row.annual_fee.unwrap_or(BigDecimal::from(0)),
        fee_waiver_criteria: row.fee_waiver_criteria,
        bank_offers: row.bank_offers.unwrap_or(json!([])),
        is_active: row.is_active.unwrap_or(true),
        is_primary: row.is_primary.unwrap_or(false),
        created_at: row.created_at,
        updated_at: row.updated_at,
    };

    Ok((StatusCode::CREATED, Json(card)))
}

/// Update a card
pub async fn update_card(
    Path(card_id): Path<Uuid>,
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(req): Json<UpdateCardRequest>,
) -> Result<Json<CardVault>, AppError> {
    // First check if the card belongs to the user
    let exists = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM card_vault WHERE id = $1 AND user_id = $2)",
        card_id,
        user.0.id
    )
    .fetch_one(&pool)
    .await?
    .unwrap_or(false);

    if !exists {
        return Err(AppError::NotFound("Card not found".to_string()));
    }

    // If setting as primary, unset other primary cards
    if req.is_primary == Some(true) {
        sqlx::query!(
            "UPDATE card_vault SET is_primary = false WHERE user_id = $1",
            user.0.id
        )
        .execute(&pool)
        .await?;
    }

    // For now, let's do a simple update
    let row = sqlx::query!(
        r#"
        UPDATE card_vault 
        SET 
            nickname = COALESCE($3, nickname),
            current_points = COALESCE($4, current_points),
            is_primary = COALESCE($5, is_primary),
            is_active = COALESCE($6, is_active),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
        card_id,
        user.0.id,
        req.nickname,
        req.current_points,
        req.is_primary,
        req.is_active
    )
    .fetch_one(&pool)
    .await?;

    let card = CardVault {
        id: row.id,
        user_id: row.user_id,
        bank_name: row.bank_name,
        card_type: row.card_type,
        card_network: row.card_network,
        last_four_digits: row.last_four_digits,
        nickname: row.nickname,
        base_reward_rate: row.base_reward_rate.unwrap_or(BigDecimal::from(0)),
        reward_type: row.reward_type.unwrap_or("points".to_string()),
        point_value_inr: row.point_value_inr.unwrap_or(BigDecimal::from(0)),
        category_rewards: row.category_rewards.unwrap_or(json!({})),
        current_points: row.current_points.unwrap_or(0),
        points_expiry_date: row.points_expiry_date,
        milestone_config: row.milestone_config.unwrap_or(json!([])),
        features: row.features.unwrap_or(json!({})),
        annual_fee: row.annual_fee.unwrap_or(BigDecimal::from(0)),
        fee_waiver_criteria: row.fee_waiver_criteria,
        bank_offers: row.bank_offers.unwrap_or(json!([])),
        is_active: row.is_active.unwrap_or(true),
        is_primary: row.is_primary.unwrap_or(false),
        created_at: row.created_at,
        updated_at: row.updated_at,
    };

    Ok(Json(card))
}

/// Delete a card (soft delete by setting is_active = false)
pub async fn delete_card(
    Path(card_id): Path<Uuid>,
    user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<impl IntoResponse, AppError> {
    let result = sqlx::query!(
        "UPDATE card_vault SET is_active = false WHERE id = $1 AND user_id = $2",
        card_id,
        user.0.id
    )
    .execute(&pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Card not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

/// Get available card templates
pub async fn get_card_templates() -> Result<Json<Vec<CardTemplate>>, AppError> {
    let templates = vec![
        CardTemplate::hdfc_infinia(),
        CardTemplate::axis_magnus(),
        CardTemplate::sbi_cashback(),
    ];

    Ok(Json(templates))
}

/// Calculate deal rankings for all user cards
pub async fn calculate_deal_rankings(
    user: AuthUser,
    State(pool): State<PgPool>,
    Json(req): Json<CalculateDealRankingRequest>,
) -> Result<Json<DealRankingResponse>, AppError> {
    // Fetch user's active cards
    let rows = sqlx::query!(
        r#"
        SELECT * FROM card_vault
        WHERE user_id = $1 AND is_active = true
        "#,
        user.0.id
    )
    .fetch_all(&pool)
    .await?;

    let cards: Vec<CardVault> = rows.into_iter().map(|row| CardVault {
        id: row.id,
        user_id: row.user_id,
        bank_name: row.bank_name,
        card_type: row.card_type,
        card_network: row.card_network,
        last_four_digits: row.last_four_digits,
        nickname: row.nickname,
        base_reward_rate: row.base_reward_rate.unwrap_or(BigDecimal::from(0)),
        reward_type: row.reward_type.unwrap_or("points".to_string()),
        point_value_inr: row.point_value_inr.unwrap_or(BigDecimal::from(0)),
        category_rewards: row.category_rewards.unwrap_or(json!({})),
        current_points: row.current_points.unwrap_or(0),
        points_expiry_date: row.points_expiry_date,
        milestone_config: row.milestone_config.unwrap_or(json!([])),
        features: row.features.unwrap_or(json!({})),
        annual_fee: row.annual_fee.unwrap_or(BigDecimal::from(0)),
        fee_waiver_criteria: row.fee_waiver_criteria,
        bank_offers: row.bank_offers.unwrap_or(json!([])),
        is_active: row.is_active.unwrap_or(true),
        is_primary: row.is_primary.unwrap_or(false),
        created_at: row.created_at,
        updated_at: row.updated_at,
    }).collect();

    let mut rankings = Vec::new();

    for card in cards {
        let analysis = calculate_card_benefit(
            &card,
            &req.merchant_name,
            &req.category,
            &req.original_price,
            &req.deal_discount,
        );
        rankings.push(analysis);
    }

    // Sort by score (highest first)
    rankings.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

    // Cache the top ranking
    if let Some(best_card) = rankings.first() {
        let expires_at = Utc::now() + chrono::Duration::hours(24);
        
        sqlx::query!(
            r#"
            INSERT INTO smart_deal_rankings (
                user_id, deal_id, original_price, deal_discount,
                recommended_card_id, card_benefit, total_savings,
                effective_price, savings_percentage, points_earned,
                milestone_progress, ranking_score, created_at, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
            ON CONFLICT (user_id, deal_id) 
            DO UPDATE SET
                recommended_card_id = EXCLUDED.recommended_card_id,
                card_benefit = EXCLUDED.card_benefit,
                total_savings = EXCLUDED.total_savings,
                effective_price = EXCLUDED.effective_price,
                savings_percentage = EXCLUDED.savings_percentage,
                points_earned = EXCLUDED.points_earned,
                milestone_progress = EXCLUDED.milestone_progress,
                ranking_score = EXCLUDED.ranking_score,
                expires_at = EXCLUDED.expires_at
            "#,
            user.0.id,
            req.deal_id,
            req.original_price,
            req.deal_discount,
            best_card.card_id,
            best_card.total_benefit,
            best_card.total_savings,
            best_card.effective_price,
            best_card.savings_percentage,
            best_card.points_earned,
            best_card.milestone_progress.as_ref().map(|m| json!(m).to_string()),
            best_card.score,
            expires_at
        )
        .execute(&pool)
        .await?;
    }

    let response = DealRankingResponse {
        deal_id: req.deal_id,
        rankings,
    };

    Ok(Json(response))
}

/// Helper function to calculate card benefits for a deal
fn calculate_card_benefit(
    card: &CardVault,
    merchant_name: &str,
    category: &str,
    original_price: &BigDecimal,
    deal_discount: &BigDecimal,
) -> CardDealAnalysis {
    
    // Calculate base reward
    let base_reward = &card.base_reward_rate * original_price / BigDecimal::from(100);
    
    // Check for category-specific rewards
    let mut category_bonus = BigDecimal::from(0);
    if let Some(cat_rewards) = card.category_rewards.as_object() {
        if let Some(rate) = cat_rewards.get(category) {
            if let Some(rate_num) = rate.as_f64() {
                category_bonus = BigDecimal::from_str(&rate_num.to_string())
                    .unwrap_or_default() * original_price / BigDecimal::from(100);
            }
        }
    }
    
    // Check for bank offers
    let mut bank_offer_discount = BigDecimal::from(0);
    if let Some(offers) = card.bank_offers.as_array() {
        for offer in offers {
            if let Some(merchant) = offer.get("merchant").and_then(|m| m.as_str()) {
                if merchant.to_lowercase() == merchant_name.to_lowercase() {
                    if let Some(discount) = offer.get("discount").and_then(|d| d.as_f64()) {
                        bank_offer_discount = BigDecimal::from_str(&discount.to_string())
                            .unwrap_or_default() * original_price;
                    }
                }
            }
        }
    }
    
    // Calculate total benefit
    let total_benefit = &base_reward + &category_bonus + &bank_offer_discount;
    
    // Calculate effective price
    let effective_price = original_price - deal_discount - &total_benefit;
    let total_savings = deal_discount + &total_benefit;
    let savings_percentage = &total_savings * BigDecimal::from(100) / original_price;
    
    // Calculate points earned
    let points_rate = if card.reward_type == "points" {
        &card.base_reward_rate
    } else {
        &BigDecimal::from(0)
    };
    
    // Safe conversion to i32 for points
    let points_earned = points_rate.clone() * original_price.clone();
    let points_earned = points_earned.to_string()
        .parse::<f64>()
        .unwrap_or(0.0) as i32;
    
    let points_value_inr = &card.point_value_inr * BigDecimal::from(points_earned);
    
    // Check milestone progress
    let milestone_progress = calculate_milestone_progress(card, points_earned);
    
    // Calculate ranking score (higher is better)
    // Score = total_savings + (points_value * 0.5) + (milestone_bonus * 2)
    let milestone_bonus = milestone_progress.as_ref()
        .map(|m| {
            if m.points_to_milestone < 1000 {
                &m.milestone_value * BigDecimal::from_str("0.1").unwrap()
            } else {
                BigDecimal::from(0)
            }
        })
        .unwrap_or_else(|| BigDecimal::from(0));
    
    let score = &total_savings 
        + (&points_value_inr * BigDecimal::from_str("0.5").unwrap())
        + (&milestone_bonus * BigDecimal::from(2));
    
    CardDealAnalysis {
        card_id: card.id,
        card_name: format!("{} {}", card.bank_name, card.card_type),
        bank_name: card.bank_name.clone(),
        base_reward,
        category_bonus,
        bank_offer_discount,
        total_benefit,
        effective_price,
        total_savings,
        savings_percentage,
        points_earned,
        points_value_inr,
        milestone_progress,
        score,
    }
}

/// Calculate milestone progress
fn calculate_milestone_progress(card: &CardVault, points_earned: i32) -> Option<MilestoneProgress> {
    if let Some(milestones) = card.milestone_config.as_array() {
        let points_after = card.current_points + points_earned;
        
        // Find the next milestone
        for milestone in milestones {
            if let (Some(threshold), Some(value)) = (
                milestone.get("threshold").and_then(|t| t.as_i64()),
                milestone.get("reward_value").and_then(|v| v.as_f64())
            ) {
                if points_after < threshold as i32 {
                    return Some(MilestoneProgress {
                        current_points: card.current_points,
                        points_after_purchase: points_after,
                        next_milestone: threshold as i32,
                        milestone_value: BigDecimal::from(value as i32),
                        points_to_milestone: (threshold as i32) - points_after,
                    });
                }
            }
        }
    }
    None
}

/// Configure card vault routes
pub fn routes(pool: PgPool) -> Router {
    Router::new()
        .route("/api/cards", get(get_user_cards).post(create_card))
        .route("/api/cards/rank-deals", post(calculate_deal_rankings))
        .route("/api/cards/:card_id", get(get_card).put(update_card).delete(delete_card))
        .with_state(pool)
}

/// Configure public card vault routes (no auth required)
pub fn public_routes() -> Router {
    Router::new()
        .route("/api/cards/templates", get(get_card_templates))
}
