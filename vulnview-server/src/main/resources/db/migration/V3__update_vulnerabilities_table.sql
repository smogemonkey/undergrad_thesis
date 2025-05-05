-- Drop existing columns
ALTER TABLE vulnerabilities DROP COLUMN IF EXISTS identifier;
ALTER TABLE vulnerabilities DROP COLUMN IF EXISTS severity;
ALTER TABLE vulnerabilities DROP COLUMN IF EXISTS cvss_vector;
ALTER TABLE vulnerabilities DROP COLUMN IF EXISTS component_id;

-- Add new columns
ALTER TABLE vulnerabilities ADD COLUMN cve_id VARCHAR(20) NOT NULL;
ALTER TABLE vulnerabilities ADD COLUMN title VARCHAR(200) NOT NULL;
ALTER TABLE vulnerabilities ADD COLUMN risk_level VARCHAR(20) NOT NULL;
ALTER TABLE vulnerabilities ADD COLUMN cvss_score VARCHAR(10);
ALTER TABLE vulnerabilities ADD COLUMN affected_versions VARCHAR(500);
ALTER TABLE vulnerabilities ADD COLUMN references VARCHAR(1000);
ALTER TABLE vulnerabilities ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE vulnerabilities ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add indexes
CREATE INDEX idx_vulnerabilities_cve_id ON vulnerabilities(cve_id);
CREATE INDEX idx_vulnerabilities_risk_level ON vulnerabilities(risk_level); 