INSERT INTO card_hide_rules (card_id, rule_type, rule_config, description) VALUES
(1, 'category_sum_below',
 '{"categories": ["groceries", "dining", "fuel"], "threshold": 800}'::jsonb,
 'Card optimized for grocery, dining, and fuel spending. Combined minimum AED 800/month needed to benefit.'),
(4, 'total_spend_range',
 '{"min": 1000, "max": 2000}'::jsonb,
 'Card optimized for moderate spenders. Best when monthly spend is between AED 1,000 and AED 2,000.'),
(2, 'category_sum_below',
 '{"categories": ["utilities"], "threshold": 500}'::jsonb,
 'Card optimized for utilities bills. Minimum AED 500/month on utilities needed to benefit.'),
(6, 'total_spend_above',
 '{"threshold": 5000}'::jsonb,
 'Starter card. Recommended for users with monthly spending below AED 5,000.');
