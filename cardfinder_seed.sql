-- ============================================================
-- CardFinder — Clean Seed SQL
-- Generated 2026-04-29
-- Run this in Railway's PostgreSQL query console to bootstrap
-- the database from scratch.
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    admin_user VARCHAR(255),
    table_name VARCHAR(100),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT NOW(),
    action_type VARCHAR(100),
    card_id INTEGER,
    card_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    label VARCHAR(100),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    slug VARCHAR(100),
    icon VARCHAR(30),
    default_spend NUMERIC DEFAULT 0,
    min_spend NUMERIC DEFAULT 0,
    max_spend NUMERIC DEFAULT 10000
);

CREATE TABLE IF NOT EXISTS income_brackets (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50),
    value NUMERIC,
    bracket VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    bank VARCHAR(255),
    card_category VARCHAR(255),
    annual_fee NUMERIC,
    fee_notes TEXT,
    min_salary NUMERIC,
    status VARCHAR(50) DEFAULT 'active',
    apply_link VARCHAR(500),
    key_benefits TEXT,
    eligibility_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_rates (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    cashback_rate NUMERIC,
    monthly_cap NUMERIC
);

CREATE TABLE IF NOT EXISTS spending_benchmarks (
    id SERIAL PRIMARY KEY,
    income_bracket VARCHAR(50),
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    monthly_amount NUMERIC
);

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    income_range VARCHAR(50),
    nationality VARCHAR(100),
    consent BOOLEAN,
    status VARCHAR(50) DEFAULT 'New',
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    income_range VARCHAR(100),
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    income_range TEXT NOT NULL,
    nationality TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_calculations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    monthly_income NUMERIC,
    spending JSONB,
    top_cards JSONB,
    net_savings NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

INSERT INTO categories (id, name, label, display_order, is_active, slug, icon, default_spend, min_spend, max_spend) VALUES
(1, 'groceries',  'Groceries',  1, TRUE, 'groceries',  '🛒',   1600, 0, 5000),
(2, 'dining',     'Dining',     2, TRUE, 'dining',     '🍽️',   600,  0, 3000),
(3, 'travel',     'Travel',     3, TRUE, 'travel',     '✈️',   400,  0, 5000),
(4, 'fuel',       'Fuel',       4, TRUE, 'fuel',       '⛽',   500,  0, 2000),
(5, 'shopping',   'Shopping',   5, TRUE, 'shopping',   '🛍️',  1000, 0, 5000),
(6, 'utilities',  'Utilities',  6, TRUE, 'utilities',  '🔧',  1000, 0, 3000),
(7, 'car_rental', 'Car Rental', 7, TRUE, 'car_rental', '🚗',  500,  0, 3000)
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', 7, TRUE);

-- ============================================================
-- INCOME BRACKETS
-- ============================================================

INSERT INTO income_brackets (id, label, value, bracket) VALUES
(1, '5K',   5000,   '5K-10K'),
(2, '10K',  10000,  '10K-20K'),
(3, '25K',  25000,  '20K-30K'),
(4, '50K',  50000,  '30K-50K'),
(5, '75K',  75000,  '50K+'),
(6, '100K', 100000, '50K+')
ON CONFLICT (id) DO NOTHING;

SELECT setval('income_brackets_id_seq', 6, TRUE);

-- ============================================================
-- CARDS
-- ============================================================

INSERT INTO cards (id, name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes, created_at) VALUES
(1, 'ADCB 365 Cashback Credit Card',    'ADCB',                'cashback', 383, 'Free year 1; AED 383 from year 2. Monthly cashback cap AED 1000. Min spend AED 5000/mo required.',                                                        8000,  'active', NULL, 'Up to 6% cashback on dining, 5% on groceries',           'Min salary AED 8000',  '2026-04-27 18:11:16.646944'),
(2, 'Emirates NBD Cashback Credit Card','Emirates NBD',        'cashback', 300, 'Min salary AED 5000. Cashback on groceries, fuel and utilities via ENBD tiered programme.',                                                                5000,  'active', NULL, 'Up to 5% cashback on groceries, fuel, utilities',         'Min salary AED 5000',  '2026-04-27 18:11:16.646944'),
(3, 'HSBC Live+ Cashback Credit Card',  'HSBC UAE',            'cashback', 314, 'Free year 1; AED 314 from year 2, waived with AED 12000 annual spend. Min spend AED 3000/mo for bonus rates. Per-category cap AED 200/statement.',         10000, 'active', NULL, '6% cashback on dining, 5% on fuel',                      'Min salary AED 10000', '2026-04-27 18:11:16.646944'),
(4, 'Dubai First Cashback Credit Card', 'Dubai First',         'cashback', 399, 'AED 399/yr waived with AED 24000 annual spend. Monthly cap AED 1000.',                                                                                    5000,  'active', NULL, 'Up to 5% cashback on groceries, dining and fuel',        'Min salary AED 5000',  '2026-04-27 18:11:16.646944'),
(6, 'Rakbank Red Credit Card',          'Rakbank',             'cashback', 0,   'Free for life. Up to 1.5% cashback on retail spends. Max AED 1000 cashback/mo.',                                                                          5000,  'active', NULL, 'Up to 1.5% cashback on retail, free for life',           'Min salary AED 5000',  '2026-04-27 18:11:16.646944'),
(9, 'Liv. Cashback Credit Card',        'Liv. (Emirates NBD)', 'cashback', 0,   'Free for life. Tiered flat cashback: 2% spend >= AED 10000/mo; 1.5% AED 5000-10000; 0.75% below AED 5000. Cap AED 750/mo.',                              5000,  'active', NULL, NULL,                                                     NULL,                   '2026-04-28 18:20:34.840259')
ON CONFLICT (id) DO NOTHING;

SELECT setval('cards_id_seq', 9, TRUE);

-- ============================================================
-- CARD RATES
-- ============================================================

INSERT INTO card_rates (id, card_id, category_id, cashback_rate, monthly_cap) VALUES
-- ADCB 365 (card 1)
(50, 1, 1, 0.05, NULL),
(51, 1, 2, 0.06, NULL),
(52, 1, 3, 0.01, NULL),
(53, 1, 4, 0.03, NULL),
(54, 1, 5, 0.01, NULL),
(55, 1, 6, 0.03, NULL),
(56, 1, 7, 0.01, NULL),
-- Emirates NBD (card 2)
(8,  2, 1, 0.05,  200),
(9,  2, 2, 0.05,  200),
(10, 2, 3, 0.02,  200),
(11, 2, 4, 0.05,  200),
(12, 2, 5, 0.015, 200),
(13, 2, 6, 0.05,  200),
(14, 2, 7, 0.005, 200),
-- HSBC Live+ (card 3)
(15, 3, 1, 0.02,  200),
(16, 3, 2, 0.06,  200),
(17, 3, 3, 0.005, 200),
(18, 3, 4, 0.05,  200),
(19, 3, 5, 0.005, 200),
(20, 3, 6, 0.005, 200),
(21, 3, 7, 0.005, 200),
-- Dubai First (card 4)
(22, 4, 1, 0.05,  250),
(23, 4, 2, 0.05,  250),
(24, 4, 3, 0.005, 250),
(25, 4, 4, 0.05,  250),
(26, 4, 5, 0.005, 250),
(27, 4, 6, 0.005, 250),
(28, 4, 7, 0.005, 250),
-- Rakbank Red (card 6)
(36, 6, 1, 0.015, 250),
(37, 6, 2, 0.015, 250),
(38, 6, 3, 0.015, 250),
(39, 6, 4, 0.003, 250),
(40, 6, 5, 0.015, 250),
(41, 6, 6, 0.003, 250),
(42, 6, 7, 0.003, 250),
-- Liv. (card 9)
(64, 9, 1, 0.02,  187),
(65, 9, 2, 0.02,  187),
(66, 9, 3, 0.02,  187),
(67, 9, 4, 0.001, 187),
(68, 9, 5, 0.02,  187),
(69, 9, 6, 0.001, 187),
(70, 9, 7, 0.001, 187)
ON CONFLICT (id) DO NOTHING;

SELECT setval('card_rates_id_seq', 70, TRUE);

-- ============================================================
-- SPENDING BENCHMARKS
-- ============================================================

INSERT INTO spending_benchmarks (id, income_bracket, category_id, monthly_amount) VALUES
-- 5K-10K
(1,  '5K-10K',  1, 800),
(2,  '5K-10K',  2, 400),
(3,  '5K-10K',  3, 300),
(4,  '5K-10K',  4, 300),
(5,  '5K-10K',  5, 500),
(6,  '5K-10K',  6, 400),
(7,  '5K-10K',  7, 0),
-- 10K-20K
(8,  '10K-20K', 1, 1200),
(9,  '10K-20K', 2, 800),
(10, '10K-20K', 3, 700),
(11, '10K-20K', 4, 500),
(12, '10K-20K', 5, 1000),
(13, '10K-20K', 6, 600),
(14, '10K-20K', 7, 300),
-- 20K-30K
(15, '20K-30K', 1, 1800),
(16, '20K-30K', 2, 1500),
(17, '20K-30K', 3, 1200),
(18, '20K-30K', 4, 700),
(19, '20K-30K', 5, 2000),
(20, '20K-30K', 6, 800),
(21, '20K-30K', 7, 600),
-- 30K-50K
(22, '30K-50K', 1, 2500),
(23, '30K-50K', 2, 2500),
(24, '30K-50K', 3, 2000),
(25, '30K-50K', 4, 900),
(26, '30K-50K', 5, 3500),
(27, '30K-50K', 6, 1000),
(28, '30K-50K', 7, 1000),
-- 50K+
(29, '50K+',    1, 3500),
(30, '50K+',    2, 4000),
(31, '50K+',    3, 4000),
(32, '50K+',    4, 1200),
(33, '50K+',    5, 6000),
(34, '50K+',    6, 1500),
(35, '50K+',    7, 2000)
ON CONFLICT (id) DO NOTHING;

SELECT setval('spending_benchmarks_id_seq', 35, TRUE);

-- ============================================================
-- ADMIN USERS
-- (passwords are bcrypt hashes — use POST /api/admin/seed-admin
--  to reset if needed, or insert a fresh hash below)
-- ============================================================

INSERT INTO admin_users (id, email, password_hash, created_at) VALUES
(1, 'admin@cardfiner.ae',  '$2b$10$zdyEAb2plld2Ax7uOb.To.qGGbVRmeWmERt6vcIP2jlr4Nv207Iei', '2026-04-27 23:05:02.249561'),
(2, 'admin@cardfinder.ae', '$2b$10$pg/X3x39roQj9bz19TsuCe9ts77OWLNACsrknuiDgJKMQojXm8QcW', '2026-04-28 17:34:54.557505')
ON CONFLICT (id) DO NOTHING;

SELECT setval('admin_users_id_seq', 2, TRUE);

-- ============================================================
-- SEQUENCE RESETS (remaining tables start fresh)
-- ============================================================

SELECT setval('audit_log_id_seq',          1, FALSE);
SELECT setval('leads_id_seq',              1, FALSE);
SELECT setval('users_id_seq',              1, FALSE);
SELECT setval('user_profiles_id_seq',      1, FALSE);
SELECT setval('user_calculations_id_seq',  1, FALSE);

-- ============================================================
-- Done. Tables created, reference data loaded.
-- ============================================================
