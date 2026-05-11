-- Add Liv age_above rule (Railway Liv card id = 9, same as local)
INSERT INTO card_hide_rules (card_id, rule_type, rule_config, description)
VALUES (9, 'age_above', '{"threshold": 60}', 'Card not available for users over 60 years old.');

-- Add Emirates Islamic Switch Cashback card
INSERT INTO cards (id, name, bank, card_category, annual_fee, min_salary, fee_notes, key_benefits, apply_link, status, created_at, updated_at)
VALUES (
  13,
  'Emirates Islamic Switch Cashback Credit Card',
  'Emirates Islamic',
  'cashback',
  0,
  5000,
  '',
  '8% cashback on fuel, 4% cashback on dining, supermarkets, and education',
  'https://www.emiratesislamic.ae/en/cards/credit-cards/switch-cashback-credit-card',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add card rates for Emirates Islamic (fuel 8%, dining 4%, groceries 4%)
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap)
SELECT 13, id, 0.08, NULL FROM categories WHERE slug = 'fuel'
ON CONFLICT DO NOTHING;

INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap)
SELECT 13, id, 0.04, NULL FROM categories WHERE slug = 'dining'
ON CONFLICT DO NOTHING;

INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap)
SELECT 13, id, 0.04, NULL FROM categories WHERE slug = 'groceries'
ON CONFLICT DO NOTHING;
