-- Create enum for deal types
CREATE TYPE deal_type AS ENUM (
    'coupon',
    'cashback',
    'pricediscount',
    'bankoffer',
    'walletoffer',
    'flashsale',
    'buyonegetone',
    'freeshipping',
    'giftcard',
    'referral'
);

-- Create deals table
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    original_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    product_url TEXT NOT NULL,
    image_url TEXT,
    merchant VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    deal_type deal_type NOT NULL,
    coupon_code VARCHAR(100),
    cashback_rate DECIMAL(5,2),
    minimum_order_value DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_date TIMESTAMPTZ,
    usage_count INTEGER NOT NULL DEFAULT 0,
    success_rate DECIMAL(5,2),
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_deals_merchant ON deals(merchant);
CREATE INDEX idx_deals_category ON deals(category);
CREATE INDEX idx_deals_deal_type ON deals(deal_type);
CREATE INDEX idx_deals_is_active ON deals(is_active);
CREATE INDEX idx_deals_is_verified ON deals(is_verified);
CREATE INDEX idx_deals_valid_until ON deals(valid_until);
CREATE INDEX idx_deals_created_at ON deals(created_at);
CREATE INDEX idx_deals_usage_count ON deals(usage_count);
CREATE INDEX idx_deals_success_rate ON deals(success_rate);
CREATE INDEX idx_deals_currency ON deals(currency);

-- Create composite indexes for common queries
CREATE INDEX idx_deals_active_verified ON deals(is_active, is_verified);
CREATE INDEX idx_deals_merchant_category ON deals(merchant, category);
CREATE INDEX idx_deals_trending ON deals(usage_count DESC, success_rate DESC) WHERE is_active = true AND is_verified = true;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_deals_updated_at 
    BEFORE UPDATE ON deals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE deals ADD CONSTRAINT chk_deals_original_price_positive CHECK (original_price > 0);
ALTER TABLE deals ADD CONSTRAINT chk_deals_discounted_price_positive CHECK (discounted_price IS NULL OR discounted_price > 0);
ALTER TABLE deals ADD CONSTRAINT chk_deals_discount_percentage_valid CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));
ALTER TABLE deals ADD CONSTRAINT chk_deals_cashback_rate_valid CHECK (cashback_rate IS NULL OR (cashback_rate >= 0 AND cashback_rate <= 100));
ALTER TABLE deals ADD CONSTRAINT chk_deals_success_rate_valid CHECK (success_rate IS NULL OR (success_rate >= 0 AND success_rate <= 100));
ALTER TABLE deals ADD CONSTRAINT chk_deals_valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from);
