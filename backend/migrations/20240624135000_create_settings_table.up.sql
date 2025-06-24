CREATE TABLE settings (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    preferred_platforms TEXT[] NOT NULL,
    alert_frequency TEXT NOT NULL,
    dark_mode BOOLEAN NOT NULL DEFAULT false,
    auto_apply_coupons BOOLEAN NOT NULL DEFAULT true,
    price_drop_notifications BOOLEAN NOT NULL DEFAULT true
);
