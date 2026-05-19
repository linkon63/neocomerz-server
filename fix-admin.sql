-- Check current state
SELECT u.id, u.name, u.email, u.role_id, r.name as role_name 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'david.brown@example.com';

-- Ensure admin role exists
INSERT INTO roles (id, name, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Update user to have admin role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
WHERE email = 'david.brown@example.com';

-- Verify the fix
SELECT u.id, u.name, u.email, u.role_id, r.name as role_name 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'david.brown@example.com';
