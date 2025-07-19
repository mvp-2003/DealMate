use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put},
    Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use bigdecimal::{BigDecimal, FromPrimitive, ToPrimitive};

use crate::models::partnership::{
    CreatePartnershipRequest, Partnership, PartnershipResponse, PartnershipStats,
    UpdatePartnershipRequest,
};

pub fn create_router() -> Router<PgPool> {
    Router::new()
        .route("/applications", post(create_partnership_application))
        .route("/applications", get(list_partnership_applications))
        .route("/applications/:id", get(get_partnership_application))
        .route("/applications/:id", put(update_partnership_application))
        .route("/stats", get(get_partnership_stats))
        .route("/active", get(list_active_partnerships))
}

#[derive(Deserialize)]
struct ListQuery {
    status: Option<String>,
    page: Option<i32>,
    limit: Option<i32>,
}

// Create a new partnership application
async fn create_partnership_application(
    State(pool): State<PgPool>,
    Json(request): Json<CreatePartnershipRequest>,
) -> Result<Json<PartnershipResponse>, StatusCode> {
    // Validate website URL
    if !request.website.starts_with("http://") && !request.website.starts_with("https://") {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Validate email format
    if !request.contact_email.contains('@') {
        return Err(StatusCode::BAD_REQUEST);
    }

    let partnership = sqlx::query_as!(
        Partnership,
        r#"
        INSERT INTO partnerships (
            business_name, website, contact_email, contact_name, phone,
            business_type, monthly_revenue, cashback_rate, description,
            average_order_value, monthly_orders, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text::partnership_status, NOW(), NOW())
        RETURNING id, business_name, website, contact_email, contact_name, phone, business_type, monthly_revenue, cashback_rate, description, average_order_value, monthly_orders, status::text as "status!", created_at, updated_at, reviewed_at, reviewer_notes"#,
        request.business_name,
        request.website,
        request.contact_email,
        request.contact_name,
        request.phone,
        request.business_type,
        request.monthly_revenue,
        request.cashback_rate.and_then(|rate| BigDecimal::from_f64(rate)),
        request.description,
        request.average_order_value.and_then(|val| BigDecimal::from_f64(val)),
        request.monthly_orders,
        "pending"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        eprintln!("Database error creating partnership: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let response = partnership.clone().into();
    
    // Send notification email (implement this based on your email service)
    tokio::spawn(async move {
        send_partnership_notification_email(&partnership).await;
    });

    Ok(Json(response))
}

// List partnership applications (admin only)
async fn list_partnership_applications(
    State(pool): State<PgPool>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Vec<PartnershipResponse>>, StatusCode> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let offset = (page - 1) * limit;

    let partnerships = match query.status {
        Some(status) => {
            sqlx::query_as!(
                Partnership,
                r#"
                SELECT id, business_name, website, contact_email, contact_name, phone, business_type, monthly_revenue, cashback_rate, description, average_order_value, monthly_orders, status::text as "status!", created_at, updated_at, reviewed_at, reviewer_notes
                FROM partnerships 
                WHERE status::text = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
                "#,
                status.as_str(),
                limit as i64,
                offset as i64
            )
            .fetch_all(&pool)
            .await
        }
        None => {
            sqlx::query_as!(
                Partnership,
                r#"
                SELECT id, business_name, website, contact_email, contact_name, phone, business_type, monthly_revenue, cashback_rate, description, average_order_value, monthly_orders, status::text as "status!", created_at, updated_at, reviewed_at, reviewer_notes
                FROM partnerships 
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
                "#,
                limit as i64,
                offset as i64
            )
            .fetch_all(&pool)
            .await
        }
    }
    .map_err(|e| {
        eprintln!("Database error listing partnerships: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let responses: Vec<PartnershipResponse> = partnerships.into_iter().map(|p| p.into()).collect();
    Ok(Json(responses))
}

// Get a specific partnership application
async fn get_partnership_application(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<PartnershipResponse>, StatusCode> {
    let partnership = sqlx::query_as!(
        Partnership,
        r#"
        SELECT id, business_name, website, contact_email, contact_name, phone, business_type, monthly_revenue, cashback_rate, description, average_order_value, monthly_orders, status::text as "status!", created_at, updated_at, reviewed_at, reviewer_notes
        FROM partnerships 
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(partnership.into()))
}

// Update partnership application (admin only)
async fn update_partnership_application(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(request): Json<UpdatePartnershipRequest>,
) -> Result<Json<PartnershipResponse>, StatusCode> {
    let has_status_change = request.status.is_some();
    
    let partnership = sqlx::query_as!(
        Partnership,
        r#"
        UPDATE partnerships 
        SET status = COALESCE($2::text::partnership_status, status),
            cashback_rate = COALESCE($3, cashback_rate),
            reviewer_notes = COALESCE($4, reviewer_notes),
            reviewed_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE reviewed_at END,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, business_name, website, contact_email, contact_name, phone, business_type, monthly_revenue, cashback_rate, description, average_order_value, monthly_orders, status::text as "status!", created_at, updated_at, reviewed_at, reviewer_notes
        "#,
        id,
        request.status.as_deref(),
        request.cashback_rate.and_then(|rate| BigDecimal::from_f64(rate)),
        request.reviewer_notes
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    let response = partnership.clone().into();
    
    // Send status update email if status changed
    if has_status_change {
        tokio::spawn(async move {
            send_status_update_email(&partnership).await;
        });
    }

    Ok(Json(response))
}

// Get partnership statistics (admin only)
async fn get_partnership_stats(
    State(pool): State<PgPool>,
) -> Result<Json<PartnershipStats>, StatusCode> {
    let stats = sqlx::query!(
        r#"SELECT COUNT(*) as total_applications,
         COUNT(*) FILTER (WHERE status::text = $1) as pending_applications,
         COUNT(*) FILTER (WHERE status::text = $2) as approved_partners,
         COUNT(*) FILTER (WHERE status::text = $3) as active_partners
         FROM partnerships"#,
        "pending",
        "approved",
        "active"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        eprintln!("Database error getting partnership stats: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get additional stats from transactions table (if exists)
    let financial_stats = sqlx::query!(
        r#"SELECT COALESCE(SUM(cashback_amount), 0) as total_cashback_paid,
         COUNT(*) as monthly_transactions
         FROM transactions 
         WHERE created_at >= NOW() - INTERVAL '30 days'
         AND transaction_type = $1"#,
        "cashback"
    )
    .fetch_optional(&pool)
    .await
    .unwrap_or(None);

    let partnership_stats = PartnershipStats {
        total_applications: stats.total_applications.unwrap_or(0) as i32,
        pending_applications: stats.pending_applications.unwrap_or(0) as i32,
        approved_partners: stats.approved_partners.unwrap_or(0) as i32,
        active_partners: stats.active_partners.unwrap_or(0) as i32,
        total_cashback_paid: financial_stats
            .as_ref()
            .and_then(|row| row.total_cashback_paid.clone())
            .and_then(|bd| bd.to_f64())
            .unwrap_or(0.0),
        monthly_transactions: financial_stats
            .as_ref()
            .and_then(|row| row.monthly_transactions)
            .unwrap_or(0) as i32,
    };

    Ok(Json(partnership_stats))
}

// List active partnerships (for public use)
async fn list_active_partnerships(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<PartnershipResponse>>, StatusCode> {
    let partnerships = sqlx::query_as!(
        Partnership,
        r#"SELECT id, business_name, website, contact_email, contact_name, phone, business_type, monthly_revenue, cashback_rate, description, average_order_value, monthly_orders, status::text as "status!", created_at, updated_at, reviewed_at, reviewer_notes
         FROM partnerships 
         WHERE status::text = $1
         ORDER BY business_name ASC"#,
        "active"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        eprintln!("Database error listing active partnerships: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Filter out sensitive information for public response
    let responses: Vec<PartnershipResponse> = partnerships
        .into_iter()
        .map(|mut p| {
            // Remove sensitive info for public API
            p.contact_email = "".to_string();
            p.phone = None;
            p.monthly_revenue = None;
            p.average_order_value = None;
            p.monthly_orders = None;
            p.into()
        })
        .collect();

    Ok(Json(responses))
}

// Email notification functions (implement based on your email service)
async fn send_partnership_notification_email(partnership: &Partnership) {
    // TODO: Implement email notification to admin team
    println!("New partnership application from: {}", partnership.business_name);
}

async fn send_status_update_email(partnership: &Partnership) {
    // TODO: Implement email notification to partner
    println!("Partnership status update for {}: {}", partnership.business_name, partnership.status);
}
