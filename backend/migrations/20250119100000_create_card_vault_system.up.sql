-- Create card_vault table (RBI compliant - no sensitive data)
CREATE TABLE card_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Card identification (non-sensitive)
    bank_name VARCHAR(100) NOT NULL,
    card_type VARCHAR(100) NOT NULL,
    card_network VARCHAR(50), -- Visa, Mastercard, Rupay, etc.
    last_four_digits CHAR(4), -- Optional, for user identification
    nickname VARCHAR(100), -- User-friendly name
    
    -- Reward structure
    base_reward_rate DECIMAL(10,4) DEFAULT 0, -- Points/Cashback per rupee (0.01 = 1%)
    reward_type VARCHAR(20) DEFAULT 'points', -- 'points', 'cashback', 'miles'
    point_value_inr DECIMAL(10,4) DEFAULT 0, -- Value of 1 point in INR
    
    -- Category-specific rewards
    category_rewards JSONB DEFAULT '{}', -- {"dining": 0.05, "travel": 0.03}
    
    -- Milestone rewards
    current_points INTEGER DEFAULT 0,
    points_expiry_date DATE,
    milestone_config JSONB DEFAULT '[]', -- [{"threshold": 10000, "reward_value": 500}]
    
    -- Card features
    features JSONB DEFAULT '{}', -- {"lounge_access": true, "fuel_surcharge_waiver": true}
    annual_fee DECIMAL(10,2) DEFAULT 0,
    fee_waiver_criteria TEXT,
    
    -- Bank-specific offers
    bank_offers JSONB DEFAULT '[]', -- [{"merchant": "Amazon", "discount": 0.10, "valid_till": "2025-12-31"}]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- User's preferred card
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_card_vault_user_id ON card_vault(user_id);
CREATE INDEX idx_card_vault_active ON card_vault(user_id, is_active);

-- Create card_transactions table (for tracking rewards earned)
CREATE TABLE card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES card_vault(id) ON DELETE CASCADE,
    
    transaction_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    
    -- Rewards earned
    points_earned INTEGER DEFAULT 0,
    cashback_earned DECIMAL(10,2) DEFAULT 0,
    
    -- Associated deal (if any)
    deal_id UUID,
    additional_discount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create card_offers table (for tracking time-sensitive offers)
CREATE TABLE card_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES card_vault(id) ON DELETE CASCADE,
    
    offer_type VARCHAR(50) NOT NULL, -- 'merchant', 'category', 'milestone'
    merchant_name VARCHAR(100),
    category VARCHAR(50),
    
    discount_percentage DECIMAL(5,2),
    max_discount DECIMAL(10,2),
    min_transaction DECIMAL(10,2),
    
    valid_from DATE NOT NULL,
    valid_till DATE NOT NULL,
    
    terms_conditions TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create smart_deal_rankings table (for caching deal rankings)
CREATE TABLE smart_deal_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL,
    
    -- Original deal details
    original_price DECIMAL(10,2) NOT NULL,
    deal_discount DECIMAL(10,2) NOT NULL,
    
    -- Best card recommendation
    recommended_card_id UUID REFERENCES card_vault(id),
    card_benefit DECIMAL(10,2) DEFAULT 0,
    
    -- Total savings
    total_savings DECIMAL(10,2) NOT NULL,
    effective_price DECIMAL(10,2) NOT NULL,
    savings_percentage DECIMAL(5,2) NOT NULL,
    
    -- Additional benefits
    points_earned INTEGER DEFAULT 0,
    milestone_progress TEXT,
    
    ranking_score DECIMAL(10,4) NOT NULL, -- Higher is better
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL -- When to recalculate
);

-- Create index for ranking queries
CREATE INDEX idx_smart_rankings_user_deal ON smart_deal_rankings(user_id, deal_id);
CREATE INDEX idx_smart_rankings_score ON smart_deal_rankings(user_id, ranking_score DESC);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_card_vault_updated_at BEFORE UPDATE ON card_vault
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
