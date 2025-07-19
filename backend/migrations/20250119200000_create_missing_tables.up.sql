-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_id VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR NOT NULL DEFAULT 'light',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    domain VARCHAR NOT NULL UNIQUE,
    affiliate_network VARCHAR,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    discount_type VARCHAR NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    affiliate_network VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create coupon_tests table
CREATE TABLE IF NOT EXISTS coupon_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    is_valid BOOLEAN NOT NULL,
    error_message TEXT,
    discount_applied DECIMAL(10,2),
    test_order_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create partnerships table
CREATE TABLE IF NOT EXISTS partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR NOT NULL,
    website VARCHAR NOT NULL,
    contact_email VARCHAR NOT NULL,
    contact_name VARCHAR NOT NULL,
    phone VARCHAR,
    business_type VARCHAR NOT NULL,
    monthly_revenue VARCHAR,
    partnership_interest TEXT,
    api_capabilities BOOLEAN NOT NULL DEFAULT false,
    current_affiliate_programs TEXT,
    expected_monthly_volume VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partnership_id UUID REFERENCES partnerships(id),
    amount DECIMAL(10,2) NOT NULL,
    cashback_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    transaction_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create card_vault table
CREATE TABLE IF NOT EXISTS card_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR NOT NULL,
    card_type VARCHAR NOT NULL,
    card_network VARCHAR NOT NULL,
    last_four_digits VARCHAR(4) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    reward_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    annual_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    joining_bonus DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create smart_deal_rankings table
CREATE TABLE IF NOT EXISTS smart_deal_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deal_id VARCHAR NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    deal_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    card_rewards DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bank_offers DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    milestone_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_benefit DECIMAL(10,2) NOT NULL,
    effective_price DECIMAL(10,2) NOT NULL,
    ranking_score DECIMAL(10,2) NOT NULL,
    recommended_card_id UUID REFERENCES card_vault(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_domain ON merchants(domain);
CREATE INDEX IF NOT EXISTS idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_tests_coupon_id ON coupon_tests(coupon_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships(status);
CREATE INDEX IF NOT EXISTS idx_partnerships_created_at ON partnerships(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partnership_id ON transactions(partnership_id);
CREATE INDEX IF NOT EXISTS idx_card_vault_user_id ON card_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_card_vault_is_active ON card_vault(is_active);
CREATE INDEX IF NOT EXISTS idx_smart_deal_rankings_user_id ON smart_deal_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_deal_rankings_ranking_score ON smart_deal_rankings(ranking_score DESC);
