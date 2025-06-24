use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::settings::{Settings, UserSettings};

pub async fn get_settings(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Settings>, StatusCode> {
    let settings = sqlx::query_as!(
        Settings,
        "SELECT user_id, preferred_platforms, alert_frequency, dark_mode, auto_apply_coupons, price_drop_notifications FROM settings WHERE user_id = $1",
        user_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(settings))
}

pub async fn update_settings(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<UserSettings>,
) -> Result<StatusCode, StatusCode> {
    println!("\n=== SETTINGS UPDATE START ===");
    println!("User ID: {}", user_id);
    println!("Payload received: {:#?}", payload);
    println!("Preferred platforms count: {}", payload.preferred_platforms.len());
    println!("Alert frequency: '{}'", payload.alert_frequency);
    
    // Test database connection
    println!("\n--- Testing database connection ---");
    match sqlx::query!("SELECT 1 as test").fetch_one(&pool).await {
        Ok(_) => println!("✓ Database connection OK"),
        Err(e) => {
            eprintln!("✗ Database connection failed: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }

    // Check if user exists first
    println!("\n--- Checking if user exists ---");
    match sqlx::query!("SELECT id FROM users WHERE id = $1", user_id).fetch_optional(&pool).await {
        Ok(Some(_)) => println!("✓ User {} exists", user_id),
        Ok(None) => {
            println!("⚠ User {} does not exist, creating...", user_id);
            match sqlx::query!("INSERT INTO users (id) VALUES ($1)", user_id).execute(&pool).await {
                Ok(_) => println!("✓ User created successfully"),
                Err(e) => {
                    eprintln!("✗ Failed to create user: {}", e);
                    eprintln!("Error type: {:?}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            }
        }
        Err(e) => {
            eprintln!("✗ Error checking user existence: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }

    // Check current settings
    println!("\n--- Checking current settings ---");
    match sqlx::query!("SELECT * FROM settings WHERE user_id = $1", user_id).fetch_optional(&pool).await {
        Ok(Some(existing)) => {
            println!("✓ Found existing settings for user {}", user_id);
            println!("Current platforms: {:?}", existing.preferred_platforms);
        }
        Ok(None) => println!("ℹ No existing settings found for user {}", user_id),
        Err(e) => eprintln!("⚠ Error checking existing settings: {}", e)
    }

    // Attempt the upsert
    println!("\n--- Executing settings upsert ---");
    println!("SQL Parameters:");
    println!("  user_id: {}", user_id);
    println!("  preferred_platforms: {:?}", payload.preferred_platforms);
    println!("  alert_frequency: '{}'", payload.alert_frequency);
    println!("  dark_mode: {}", payload.dark_mode);
    println!("  auto_apply_coupons: {}", payload.auto_apply_coupons);
    println!("  price_drop_notifications: {}", payload.price_drop_notifications);

    let result = sqlx::query!(
        "INSERT INTO settings (user_id, preferred_platforms, alert_frequency, dark_mode, auto_apply_coupons, price_drop_notifications)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE
         SET preferred_platforms = EXCLUDED.preferred_platforms,
             alert_frequency = EXCLUDED.alert_frequency,
             dark_mode = EXCLUDED.dark_mode,
             auto_apply_coupons = EXCLUDED.auto_apply_coupons,
             price_drop_notifications = EXCLUDED.price_drop_notifications",
        user_id,
        &payload.preferred_platforms,
        payload.alert_frequency,
        payload.dark_mode,
        payload.auto_apply_coupons,
        payload.price_drop_notifications
    )
    .execute(&pool)
    .await;

    match result {
        Ok(query_result) => {
            println!("✓ Settings upsert successful!");
            println!("Rows affected: {}", query_result.rows_affected());
            println!("=== SETTINGS UPDATE END ===\n");
            Ok(StatusCode::OK)
        }
        Err(e) => {
            eprintln!("\n✗ SETTINGS UPDATE FAILED!");
            eprintln!("Error: {}", e);
            eprintln!("Error debug: {:#?}", e);
            
            // Detailed error analysis
            match &e {
                sqlx::Error::Database(db_err) => {
                    eprintln!("Database error details:");
                    eprintln!("  Code: {:?}", db_err.code());
                    eprintln!("  Message: {}", db_err.message());
                    eprintln!("  Constraint: {:?}", db_err.constraint());
                    eprintln!("  Table: {:?}", db_err.table());
                    // eprintln!("  Column: {:?}", db_err.column()); // column() method not available in sqlx 0.7
                }
                sqlx::Error::Decode(decode_err) => {
                    eprintln!("Decode error: {}", decode_err);
                }
                sqlx::Error::PoolClosed => {
                    eprintln!("Database pool is closed!");
                }
                _ => {
                    eprintln!("Other error type: {:?}", e);
                }
            }
            
            eprintln!("=== SETTINGS UPDATE END ===\n");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
