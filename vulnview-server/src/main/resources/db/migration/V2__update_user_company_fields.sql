-- Drop unused columns
ALTER TABLE users DROP COLUMN IF EXISTS company_website;
ALTER TABLE users DROP COLUMN IF EXISTS company_size;
ALTER TABLE users DROP COLUMN IF EXISTS system_role;

-- Add new company domain column
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_domain VARCHAR(255);

-- Update existing users to have a default company domain
UPDATE users SET company_domain = 'example.com' WHERE company_domain IS NULL; 