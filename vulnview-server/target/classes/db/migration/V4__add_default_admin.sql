-- Add default admin user (password: admin123)
INSERT INTO users (username, email, password, role, created_at, updated_at)
VALUES ('admin', 'admin@example.com', '$2a$10$rDkPvvAFV8c3JZxX5X5X5O5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING; 