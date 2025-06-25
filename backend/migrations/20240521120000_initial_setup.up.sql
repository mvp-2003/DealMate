-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    auth0_id TEXT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY,
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
