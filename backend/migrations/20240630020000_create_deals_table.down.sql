-- Drop the deals table and related objects
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS deals;
DROP TYPE IF EXISTS deal_type;
