-- Create partnership status enum
CREATE TYPE partnership_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'active', 'suspended');

-- Create partnerships table
CREATE TABLE partnerships (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    website VARCHAR(500) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_type VARCHAR(100) NOT NULL,
    monthly_revenue VARCHAR(50),
    cashback_rate DECIMAL(5,2),
    description TEXT,
    average_order_value DECIMAL(10,2),
    monthly_orders VARCHAR(50),
    status partnership_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    
    -- Constraints
    CONSTRAINT unique_website UNIQUE(website),
    CONSTRAINT unique_contact_email UNIQUE(contact_email),
    CONSTRAINT valid_cashback_rate CHECK (cashback_rate >= 0 AND cashback_rate <= 100),
    CONSTRAINT valid_average_order_value CHECK (average_order_value >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_partnerships_status ON partnerships(status);
CREATE INDEX idx_partnerships_created_at ON partnerships(created_at);
CREATE INDEX idx_partnerships_business_type ON partnerships(business_type);
CREATE INDEX idx_partnerships_website ON partnerships(website);

-- Create transactions table for tracking cashback payments (if not exists)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    partnership_id INTEGER REFERENCES partnerships(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    cashback_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    merchant_name VARCHAR(255),
    order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partnership_id ON transactions(partnership_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Insert some sample partnerships for testing
INSERT INTO partnerships (
    business_name, website, contact_email, contact_name, phone,
    business_type, monthly_revenue, cashback_rate, description,
    average_order_value, monthly_orders, status
) VALUES 
(
    'TechGear Plus', 'https://techgearplus.com', 'partners@techgearplus.com',
    'Sarah Johnson', '+1-555-0123', 'Electronics', '100k-500k', 3.5,
    'Leading online retailer of consumer electronics and gadgets',
    125.00, '1000-5000', 'active'
),
(
    'Fashion Forward', 'https://fashionforward.com', 'business@fashionforward.com',
    'Mike Chen', '+1-555-0456', 'Fashion & Apparel', '50k-100k', 4.0,
    'Trendy fashion retailer for young adults',
    85.00, '500-1000', 'active'
),
(
    'Home Essentials', 'https://homeessentials.com', 'contact@homeessentials.com',
    'Lisa Rodriguez', '+1-555-0789', 'Home & Garden', '10k-50k', 2.5,
    'Quality home goods and decor at affordable prices',
    60.00, '100-500', 'approved'
),
(
    'Sports Zone', 'https://sportszone.com', 'hello@sportszone.com',
    'David Kim', '+1-555-0321', 'Sports & Outdoors', '500k+', 2.0,
    'Premium sports equipment and outdoor gear',
    150.00, '5000+', 'pending'
);
