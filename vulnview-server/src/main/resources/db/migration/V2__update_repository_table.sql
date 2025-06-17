-- Update repositories table
ALTER TABLE repositories
    ADD COLUMN IF NOT EXISTS github_repo_id BIGINT,
    ADD COLUMN IF NOT EXISTS html_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS default_branch VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP,
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id); 