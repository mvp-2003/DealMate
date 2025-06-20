-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    created_at TIMESTAMP
);

-- Create wallets table
CREATE TABLE wallets (
    id UUID,
    user_id UUID,
    bank TEXT,
    card_type TEXT,
    reward_rate FLOAT,
    current_points INT,
    threshold INT,
    reward_value FLOAT
);

-- Create purchases table
CREATE TABLE purchases (
    id UUID,
    user_id UUID,
    product_id TEXT,
    price FLOAT,
    saved FLOAT,
    timestamp TIMESTAMP
);

-- Create rewards table
CREATE TABLE rewards (
    user_id UUID,
    goal TEXT,
    target_points INT,
    reward_value FLOAT,
    unlocked BOOLEAN
);
