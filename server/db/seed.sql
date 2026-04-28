-- Categories
INSERT INTO categories (name, label, display_order) VALUES
  ('groceries',  'Groceries',  1),
  ('dining',     'Dining',     2),
  ('travel',     'Travel',     3),
  ('fuel',       'Fuel',       4),
  ('shopping',   'Shopping',   5),
  ('utilities',  'Utilities',  6),
  ('car_rental', 'Car Rental', 7)
ON CONFLICT DO NOTHING;

-- Cards
INSERT INTO cards (name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes, created_at) VALUES
(
  'ADCB 365 Cashback Credit Card', 'ADCB', 'cashback', 383,
  'Free year 1; AED 383 from year 2. Monthly cashback cap AED 1000. Min spend AED 5000/mo required.',
  8000, 'active', '', 'Up to 6% cashback on dining, 5% on groceries', 'Min salary AED 8000', NOW()
),
(
  'Emirates NBD Cashback Credit Card', 'Emirates NBD', 'cashback', 300,
  'Min salary AED 5000. Cashback on groceries, fuel and utilities via ENBD tiered programme.',
  5000, 'active', '', 'Up to 5% cashback on groceries, fuel, utilities', 'Min salary AED 5000', NOW()
),
(
  'HSBC Live+ Cashback Credit Card', 'HSBC UAE', 'cashback', 314,
  'Free year 1; AED 314 from year 2, waived with AED 12000 annual spend. Min spend AED 3000/mo for bonus rates. Per-category cap AED 200/statement.',
  10000, 'active', '', '6% cashback on dining, 5% on fuel', 'Min salary AED 10000', NOW()
),
(
  'Dubai First Cashback Credit Card', 'Dubai First', 'cashback', 399,
  'AED 399/yr waived with AED 24000 annual spend. Monthly cap AED 1000.',
  5000, 'active', '', 'Up to 5% cashback on groceries, dining and fuel', 'Min salary AED 5000', NOW()
),
(
  'Liv. Cashback Credit Card', 'Liv. (Emirates NBD)', 'cashback', 0,
  'Free for life. Tiered flat cashback: 2% spend >= AED 10000/mo; 1.5% AED 5000-10000; 0.75% below AED 5000. Cap AED 750/mo.',
  5000, 'active', '', 'Up to 2% flat cashback, free for life', 'Min salary AED 5000', NOW()
),
(
  'Rakbank Red Credit Card', 'Rakbank', 'cashback', 0,
  'Free for life. Up to 1.5% cashback on retail spends. Max AED 1000 cashback/mo.',
  5000, 'active', '', 'Up to 1.5% cashback on retail, free for life', 'Min salary AED 5000', NOW()
);

-- Card rates (referencing cards by name subquery and categories by name subquery)
-- ADCB 365
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='groceries'),  0.05, 200),
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='dining'),     0.06, 200),
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='travel'),     0.01, 200),
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='fuel'),       0.03, 200),
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='shopping'),   0.01, 200),
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='utilities'),  0.03, 200),
((SELECT id FROM cards WHERE name='ADCB 365 Cashback Credit Card'), (SELECT id FROM categories WHERE name='car_rental'), 0.01, 200);

-- Emirates NBD Cashback
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='groceries'),  0.05,  200),
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='dining'),     0.05,  200),
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='travel'),     0.02,  200),
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='fuel'),       0.05,  200),
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='shopping'),   0.015, 200),
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='utilities'),  0.05,  200),
((SELECT id FROM cards WHERE name='Emirates NBD Cashback Credit Card'), (SELECT id FROM categories WHERE name='car_rental'), 0.005, 200);

-- HSBC Live+
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='groceries'),  0.02,  200),
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='dining'),     0.06,  200),
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='travel'),     0.005, 200),
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='fuel'),       0.05,  200),
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='shopping'),   0.005, 200),
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='utilities'),  0.005, 200),
((SELECT id FROM cards WHERE name='HSBC Live+ Cashback Credit Card'), (SELECT id FROM categories WHERE name='car_rental'), 0.005, 200);

-- Dubai First Cashback
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='groceries'),  0.05,  250),
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='dining'),     0.05,  250),
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='travel'),     0.005, 250),
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='fuel'),       0.05,  250),
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='shopping'),   0.005, 250),
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='utilities'),  0.005, 250),
((SELECT id FROM cards WHERE name='Dubai First Cashback Credit Card'), (SELECT id FROM categories WHERE name='car_rental'), 0.005, 250);

-- Liv. Cashback
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='groceries'),  0.02,  187),
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='dining'),     0.02,  187),
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='travel'),     0.02,  187),
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='fuel'),       0.001, 187),
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='shopping'),   0.02,  187),
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='utilities'),  0.001, 187),
((SELECT id FROM cards WHERE name='Liv. Cashback Credit Card'), (SELECT id FROM categories WHERE name='car_rental'), 0.001, 187);

-- Rakbank Red
INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='groceries'),  0.015, 250),
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='dining'),     0.015, 250),
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='travel'),     0.015, 250),
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='fuel'),       0.003, 250),
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='shopping'),   0.015, 250),
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='utilities'),  0.003, 250),
((SELECT id FROM cards WHERE name='Rakbank Red Credit Card'), (SELECT id FROM categories WHERE name='car_rental'), 0.003, 250);

-- Spending benchmarks
INSERT INTO spending_benchmarks (income_bracket, category_id, monthly_amount) VALUES
('5K-10K',  (SELECT id FROM categories WHERE name='groceries'),   800),
('5K-10K',  (SELECT id FROM categories WHERE name='dining'),      400),
('5K-10K',  (SELECT id FROM categories WHERE name='travel'),      300),
('5K-10K',  (SELECT id FROM categories WHERE name='fuel'),        300),
('5K-10K',  (SELECT id FROM categories WHERE name='shopping'),    500),
('5K-10K',  (SELECT id FROM categories WHERE name='utilities'),   400),
('5K-10K',  (SELECT id FROM categories WHERE name='car_rental'),  0),

('10K-20K', (SELECT id FROM categories WHERE name='groceries'),  1200),
('10K-20K', (SELECT id FROM categories WHERE name='dining'),      800),
('10K-20K', (SELECT id FROM categories WHERE name='travel'),      700),
('10K-20K', (SELECT id FROM categories WHERE name='fuel'),        500),
('10K-20K', (SELECT id FROM categories WHERE name='shopping'),   1000),
('10K-20K', (SELECT id FROM categories WHERE name='utilities'),   600),
('10K-20K', (SELECT id FROM categories WHERE name='car_rental'),  300),

('20K-30K', (SELECT id FROM categories WHERE name='groceries'),  1800),
('20K-30K', (SELECT id FROM categories WHERE name='dining'),     1500),
('20K-30K', (SELECT id FROM categories WHERE name='travel'),     1200),
('20K-30K', (SELECT id FROM categories WHERE name='fuel'),        700),
('20K-30K', (SELECT id FROM categories WHERE name='shopping'),   2000),
('20K-30K', (SELECT id FROM categories WHERE name='utilities'),   800),
('20K-30K', (SELECT id FROM categories WHERE name='car_rental'),  600),

('30K-50K', (SELECT id FROM categories WHERE name='groceries'),  2500),
('30K-50K', (SELECT id FROM categories WHERE name='dining'),     2500),
('30K-50K', (SELECT id FROM categories WHERE name='travel'),     2000),
('30K-50K', (SELECT id FROM categories WHERE name='fuel'),        900),
('30K-50K', (SELECT id FROM categories WHERE name='shopping'),   3500),
('30K-50K', (SELECT id FROM categories WHERE name='utilities'),  1000),
('30K-50K', (SELECT id FROM categories WHERE name='car_rental'), 1000),

('50K+',    (SELECT id FROM categories WHERE name='groceries'),  3500),
('50K+',    (SELECT id FROM categories WHERE name='dining'),     4000),
('50K+',    (SELECT id FROM categories WHERE name='travel'),     4000),
('50K+',    (SELECT id FROM categories WHERE name='fuel'),       1200),
('50K+',    (SELECT id FROM categories WHERE name='shopping'),   6000),
('50K+',    (SELECT id FROM categories WHERE name='utilities'),  1500),
('50K+',    (SELECT id FROM categories WHERE name='car_rental'), 2000);
