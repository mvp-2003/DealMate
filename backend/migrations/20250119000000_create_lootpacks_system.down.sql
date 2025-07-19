-- Drop all LootPacks system tables in reverse order of creation

DROP TABLE IF EXISTS lootpack_events CASCADE;
DROP TABLE IF EXISTS pack_reward_mappings CASCADE;
DROP TABLE IF EXISTS user_lootpack_stats CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS reward_templates CASCADE;
DROP TABLE IF EXISTS user_pack_history CASCADE;
DROP TABLE IF EXISTS pack_types CASCADE;
