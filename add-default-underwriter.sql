-- SQL script to add default underwriter account (Jhon Doe)
-- Run this if you need to manually add the underwriter to the database

-- First, ensure the ROLE_UNDERWRITER exists
INSERT INTO roles (name, description) 
SELECT 'ROLE_UNDERWRITER', 'Policy Underwriter'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_UNDERWRITER');

-- Get the role_id for ROLE_UNDERWRITER
SET @underwriter_role_id = (SELECT id FROM roles WHERE name = 'ROLE_UNDERWRITER');

-- Add the default underwriter account (Jhon Doe)
-- Email: jhon.doe@example.com
-- Password: password (BCrypt hashed)
INSERT INTO users (email, username, password, first_name, last_name, role_id, created_date, language, currency, timezone, theme)
SELECT 
    'jhon.doe@example.com',
    'jhon.doe@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqQdLRL.7wPbFLdX3OKb5YqJqG7GtWy', -- BCrypt hash for 'password'
    'Jhon',
    'Doe',
    @underwriter_role_id,
    NOW(),
    'en',
    'USD',
    'UTC',
    'light'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'jhon.doe@example.com');

-- Verify the underwriter was created
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'jhon.doe@example.com';