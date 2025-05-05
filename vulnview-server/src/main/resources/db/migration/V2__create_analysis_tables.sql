-- Create analyses table
CREATE TABLE analyses (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create vulnerability_affected_components table
CREATE TABLE vulnerability_affected_components (
    vulnerability_id BIGINT NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (vulnerability_id, component_name),
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX idx_analyses_project_id ON analyses(project_id);
CREATE INDEX idx_vulnerability_affected_components_vulnerability_id ON vulnerability_affected_components(vulnerability_id); 