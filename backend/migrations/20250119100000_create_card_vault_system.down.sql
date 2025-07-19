-- Drop tables in reverse order due to foreign key constraints
DROP TABLE IF EXISTS smart_deal_rankings;
DROP TABLE IF EXISTS card_offers;
DROP TABLE IF EXISTS card_transactions;
DROP TABLE IF EXISTS card_vault;

-- Drop trigger and function
DROP TRIGGER IF EXISTS update_card_vault_updated_at ON card_vault;
DROP FUNCTION IF EXISTS update_updated_at_column();
