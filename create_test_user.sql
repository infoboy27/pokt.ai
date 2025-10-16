INSERT INTO users (id, email, name, auth0_sub, password, verification_code, verification_code_expires_at, created_at, updated_at, organization_id)
VALUES ('user_test2_1759330500000', 'testuser2@pokt.ai', 'Test User 2', 'auth0|testuser2', 'password123', '123456', NOW() + INTERVAL '15 minutes', NOW(), NOW(), 'org-1')
RETURNING id, email, name;











