CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth0_user_id TEXT UNIQUE, -- Stores the 'sub' from Auth0 JWT
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Hashed password for local accounts, NULL for Auth0 users
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deal_preferences JSONB, -- Flexible for storing user preferences
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: Create an index for faster lookups on auth0_user_id
CREATE INDEX idx_users_auth0_user_id ON users(auth0_user_id);

-- A trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
