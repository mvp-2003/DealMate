use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub user_id: Uuid,
    pub preferred_platforms: Vec<String>,
    pub alert_frequency: String,
    pub dark_mode: bool,
    pub auto_apply_coupons: bool,
    pub price_drop_notifications: bool,
}
