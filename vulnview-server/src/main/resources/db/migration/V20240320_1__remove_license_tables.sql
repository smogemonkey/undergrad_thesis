-- Drop license-related tables
DROP TABLE IF EXISTS component_license_compliance;
DROP TABLE IF EXISTS license_policy_rule;
DROP TABLE IF EXISTS license_policy;
DROP TABLE IF EXISTS license;

-- Remove license-related columns from components table
ALTER TABLE components DROP COLUMN IF EXISTS license;
ALTER TABLE components DROP COLUMN IF EXISTS license_id; 