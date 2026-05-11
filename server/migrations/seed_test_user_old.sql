INSERT INTO users (email, password, full_name, date_of_birth, income_range, nationality, auth_provider, created_at)
VALUES (
  'olduser@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi',
  'Test Old User',
  '1954-01-01',
  'AED 10,000 - 15,000',
  'UAE',
  'email',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET date_of_birth = '1954-01-01'
RETURNING id, email, date_of_birth;
