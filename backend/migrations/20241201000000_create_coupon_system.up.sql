-- Create merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    affiliate_network VARCHAR(100),
    commission_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create coupons table
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    code VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value DECIMAL(10,2),
    minimum_order DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50) NOT NULL,
    affiliate_network VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(merchant_id, code)
);

-- Create coupon_tests table to track validation
CREATE TABLE coupon_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_valid BOOLEAN NOT NULL,
    error_message TEXT,
    discount_applied DECIMAL(10,2),
    test_order_value DECIMAL(10,2)
);

-- Create user_coupon_usage table
CREATE TABLE user_coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    order_value DECIMAL(10,2),
    discount_applied DECIMAL(10,2),
    UNIQUE(user_id, coupon_id)
);

-- Create affiliate_networks table
CREATE TABLE affiliate_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    commission_rate DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_merchants_domain ON merchants(domain);
CREATE INDEX idx_coupon_tests_coupon_id ON coupon_tests(coupon_id);
CREATE INDEX idx_user_coupon_usage_user_id ON user_coupon_usage(user_id);