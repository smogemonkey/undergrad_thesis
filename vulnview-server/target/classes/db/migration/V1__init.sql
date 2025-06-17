-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    system_role VARCHAR(255) NOT NULL DEFAULT 'USER',
    company_name VARCHAR(255) NOT NULL,
    company_domain VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    github_username VARCHAR(100),
    github_token VARCHAR(255),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create repositories table
CREATE TABLE repositories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    html_url VARCHAR(255),
    default_branch VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    repository_id BIGINT REFERENCES repositories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create memberships table
CREATE TABLE memberships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    project_id BIGINT NOT NULL REFERENCES projects(id),
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, project_id)
);

-- Create sboms table
CREATE TABLE sboms (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id),
    repository_id BIGINT NOT NULL REFERENCES repositories(id),
    version VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    bom_format VARCHAR(100),
    spec_version VARCHAR(100),
    content JSONB,
    commit_sha VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create components table
CREATE TABLE components (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    type VARCHAR(100),
    package_url VARCHAR(500),
    license VARCHAR(100),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'NONE',
    project_id BIGINT NOT NULL REFERENCES projects(id),
    sbom_id BIGINT REFERENCES sboms(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vulnerabilities table
CREATE TABLE vulnerabilities (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    risk_level VARCHAR(20),
    cvss_score DOUBLE PRECISION DEFAULT 0.0,
    cvss_vector VARCHAR(100),
    cwe VARCHAR(50),
    reference TEXT,
    published_date TIMESTAMP,
    remediation TEXT,
    project_id BIGINT REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create component_vulnerabilities table
CREATE TABLE component_vulnerabilities (
    id BIGSERIAL PRIMARY KEY,
    component_id BIGINT REFERENCES components(id),
    vulnerability_id BIGINT REFERENCES vulnerabilities(id),
    sbom_id BIGINT NOT NULL REFERENCES sboms(id),
    status VARCHAR(50),
    severity VARCHAR(50),
    score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dependency_edges table
CREATE TABLE dependency_edges (
    id BIGSERIAL PRIMARY KEY,
    source_id BIGINT REFERENCES components(id),
    target_id BIGINT REFERENCES components(id),
    sbom_id BIGINT REFERENCES sboms(id),
    UNIQUE (source_id, target_id)
);

-- Add indexes
CREATE INDEX idx_components_project_id ON components(project_id);
CREATE INDEX idx_vulnerabilities_project_id ON vulnerabilities(project_id);
CREATE INDEX idx_sboms_project_id ON sboms(project_id);
CREATE INDEX idx_component_vulnerabilities_component_id ON component_vulnerabilities(component_id);
CREATE INDEX idx_component_vulnerabilities_vulnerability_id ON component_vulnerabilities(vulnerability_id);
CREATE INDEX idx_dependency_edges_source_id ON dependency_edges(source_id);
CREATE INDEX idx_dependency_edges_target_id ON dependency_edges(target_id); 