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

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  label VARCHAR(100),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true
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

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  admin_user VARCHAR(255),
  table_name VARCHAR(100),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
