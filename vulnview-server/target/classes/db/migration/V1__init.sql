-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    version VARCHAR(50),
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (name, owner_id)
);

-- Create components table
CREATE TABLE components (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    package_url VARCHAR(500) NOT NULL,
    license VARCHAR(100),
    risk_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create project_components table
CREATE TABLE project_components (
    project_id BIGINT NOT NULL,
    component_id BIGINT NOT NULL,
    PRIMARY KEY (project_id, component_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);

-- Create vulnerabilities table
CREATE TABLE vulnerabilities (
    id BIGSERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    remediation TEXT,
    published_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

-- Create component_vulnerabilities table
CREATE TABLE component_vulnerabilities (
    component_id BIGINT NOT NULL,
    vulnerability_id BIGINT NOT NULL,
    PRIMARY KEY (component_id, vulnerability_id),
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_components_package_url ON components(package_url);
CREATE INDEX idx_components_risk_level ON components(risk_level); 