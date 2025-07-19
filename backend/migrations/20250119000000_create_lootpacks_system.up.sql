-- LootPacks System Tables

-- Pack Types Definition
CREATE TABLE pack_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('free', 'premium')),
    description TEXT,
    icon VARCHAR(100),
    color_gradient VARCHAR(255),
    price_coins INTEGER,
    cooldown_hours INTEGER,
    min_rewards INTEGER NOT NULL DEFAULT 1,
    max_rewards INTEGER NOT NULL DEFAULT 3,
    possible_reward_types TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Pack History
CREATE TABLE user_pack_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(auth0_id) ON DELETE CASCADE,
    pack_type_id UUID NOT NULL REFERENCES pack_types(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    rewards_count INTEGER NOT NULL,
    total_value_inr DECIMAL(10, 2)
);

-- Reward Templates
CREATE TABLE reward_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('coupon', 'cashback', 'points', 'voucher', 'exclusive', 'jackpot')),
    title VARCHAR(255) NOT NULL,
    value VARCHAR(100) NOT NULL,
    description TEXT,
    rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    code_pattern VARCHAR(255), -- For generating unique codes
    validity_days INTEGER DEFAULT 7,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Rewards Inventory
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(auth0_id) ON DELETE CASCADE,
    pack_history_id UUID REFERENCES user_pack_history(id),
    template_id UUID REFERENCES reward_templates(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    value VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(100) UNIQUE,
    rarity VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL, -- Which pack it came from
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User LootPack Stats
CREATE TABLE user_lootpack_stats (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(auth0_id) ON DELETE CASCADE,
    deal_coins INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily_claim TIMESTAMPTZ,
    total_packs_opened INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    level_progress INTEGER DEFAULT 0,
    total_savings_inr DECIMAL(10, 2) DEFAULT 0,
    member_status VARCHAR(50) DEFAULT 'Bronze',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pack Type Reward Mappings (which rewards can appear in which packs)
CREATE TABLE pack_reward_mappings (
    pack_type_id UUID REFERENCES pack_types(id) ON DELETE CASCADE,
    reward_template_id UUID REFERENCES reward_templates(id) ON DELETE CASCADE,
    weight INTEGER DEFAULT 100, -- Higher weight = more likely to appear
    PRIMARY KEY (pack_type_id, reward_template_id)
);

-- Special Events
CREATE TABLE lootpack_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    multiplier DECIMAL(3, 2) DEFAULT 1.0,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_pack_history_user_id ON user_pack_history(user_id);
CREATE INDEX idx_user_pack_history_opened_at ON user_pack_history(opened_at);
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_expires_at ON user_rewards(expires_at);
CREATE INDEX idx_user_rewards_is_used ON user_rewards(is_used);
CREATE INDEX idx_lootpack_events_active ON lootpack_events(is_active, starts_at, ends_at);

-- Insert default pack types
INSERT INTO pack_types (name, type, description, icon, color_gradient, price_coins, cooldown_hours, min_rewards, max_rewards, possible_reward_types) VALUES
('Daily Free Pack', 'free', 'Your daily dose of rewards!', 'Gift', 'from-green-400 to-emerald-600', NULL, 24, 1, 3, ARRAY['coupon', 'cashback', 'points']),
('Bronze Pack', 'premium', 'Basic rewards with guaranteed value', 'Package2', 'from-orange-400 to-amber-600', 99, NULL, 3, 5, ARRAY['coupon', 'cashback', 'points', 'voucher']),
('Silver Pack', 'premium', 'Enhanced rewards with rare items', 'Sparkles', 'from-gray-400 to-slate-600', 299, NULL, 5, 8, ARRAY['coupon', 'cashback', 'points', 'voucher', 'exclusive']),
('Gold Pack', 'premium', 'Premium rewards with exclusive deals', 'Crown', 'from-yellow-400 to-yellow-600', 599, NULL, 8, 12, ARRAY['coupon', 'cashback', 'points', 'voucher', 'exclusive', 'jackpot']);

-- Insert sample reward templates
INSERT INTO reward_templates (type, title, value, description, rarity, validity_days) VALUES
-- Coupons
('coupon', 'Amazon 10% OFF', '10% OFF', 'Valid on electronics', 'common', 7),
('coupon', 'Flipkart ₹200 OFF', '₹200 OFF', 'Min order ₹1000', 'rare', 14),
('coupon', 'Myntra 25% OFF', '25% OFF', 'Fashion & lifestyle', 'epic', 7),
-- Cashback
('cashback', 'Paytm Cashback', '5% CB', 'Max ₹100', 'common', 30),
('cashback', 'PhonePe Cashback', '₹50 CB', 'On first order', 'rare', 14),
('cashback', 'HDFC Cashback', '10% CB', 'Credit card only', 'epic', 30),
-- Points
('points', 'DealCoins', '+50', 'Use in app', 'common', NULL),
('points', 'Bonus Points', '+100', 'Limited time', 'rare', NULL),
('points', 'Mega Points', '+500', 'Jackpot!', 'legendary', NULL),
-- Vouchers
('voucher', 'Swiggy Voucher', '₹100', 'Food delivery', 'rare', 14),
('voucher', 'Uber Credits', '₹150', 'Ride credits', 'epic', 30),
-- Exclusive
('exclusive', 'VIP Access', 'Early Access', 'Sale preview', 'epic', 7),
('exclusive', 'Premium Deal', 'Exclusive', 'Members only', 'legendary', 30),
-- Jackpot
('jackpot', 'MEGA JACKPOT', '₹5000', 'Shopping voucher', 'legendary', 60);
