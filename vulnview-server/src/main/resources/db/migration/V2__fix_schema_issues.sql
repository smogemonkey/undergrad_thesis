-- Step 1: Drop existing constraints to avoid conflicts
ALTER TABLE components DROP CONSTRAINT IF EXISTS fk_components_license;
ALTER TABLE sboms DROP CONSTRAINT IF EXISTS fk_sboms_repository;

-- Step 2: Ensure repositories table exists and has required columns
CREATE TABLE IF NOT EXISTS repositories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    github_repo_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    default_branch VARCHAR(255) NOT NULL,
    project_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_synced_at TIMESTAMP
);

-- Step 3: Add repository_id column to sboms if it doesn't exist
ALTER TABLE sboms ADD COLUMN IF NOT EXISTS repository_id BIGINT;

-- Step 4: Add commit_sha column to sboms if it doesn't exist
ALTER TABLE sboms ADD COLUMN IF NOT EXISTS commit_sha VARCHAR(255);

-- Step 5: Update existing rows with default values
UPDATE sboms SET repository_id = 1 WHERE repository_id IS NULL;
UPDATE sboms SET commit_sha = '' WHERE commit_sha IS NULL;

-- Step 6: Make columns NOT NULL after setting defaults
ALTER TABLE sboms ALTER COLUMN repository_id SET NOT NULL;
ALTER TABLE sboms ALTER COLUMN commit_sha SET NOT NULL;

-- Step 7: Fix license_id type in components table
ALTER TABLE components ALTER COLUMN license_id VARCHAR(100);

-- Step 8: Fix cvss_score type in vulnerabilities table
ALTER TABLE vulnerabilities ALTER COLUMN cvss_score DOUBLE;

-- Step 9: Add system_role to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role VARCHAR(255) DEFAULT 'USER';
UPDATE users SET system_role = 'USER' WHERE system_role IS NULL;
ALTER TABLE users ALTER COLUMN system_role SET NOT NULL;

-- Step 10: Re-add foreign key constraints
ALTER TABLE components ADD CONSTRAINT fk_components_license 
    FOREIGN KEY (license_id) REFERENCES licenses(id);
ALTER TABLE sboms ADD CONSTRAINT fk_sboms_repository 
    FOREIGN KEY (repository_id) REFERENCES repositories(id); 