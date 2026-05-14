const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const { isHardEligible, evaluateHideRules } = require('../services/recommendationEngine');

const optionalUserAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* ignore invalid token */ }
  }
  next();
};

// GET all active cards with their rates
router.get('/', async (req, res) => {
  try {
    const cards = await pool.query(
      `SELECT c.*, cc.name AS category_name,
        json_agg(
          json_build_object(
            'category_id', cr.category_id,
            'category_name', cat.name,
            'cashback_rate', cr.cashback_rate,
            'monthly_cap', cr.monthly_cap
          )
        ) AS rates
       FROM cards c
       LEFT JOIN card_categories cc ON cc.slug = c.card_category
       LEFT JOIN card_rates cr ON cr.card_id = c.id
       LEFT JOIN categories cat ON cat.id = cr.category_id
       WHERE c.status = 'active'
       GROUP BY c.id, cc.name
       ORDER BY c.name`
    );
    res.json(cards.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single card by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const card = await pool.query(
      `SELECT c.*, cc.name AS category_name,
        json_agg(
          json_build_object(
            'category_id', cr.category_id,
            'category_slug', cat.slug,
            'category_name', cat.name,
            'category_icon', cat.icon,
            'cashback_rate', cr.cashback_rate,
            'monthly_cap', cr.monthly_cap
          ) ORDER BY cr.cashback_rate DESC
        ) FILTER (WHERE cr.id IS NOT NULL) AS rates
       FROM cards c
       LEFT JOIN card_categories cc ON cc.slug = c.card_category
       LEFT JOIN card_rates cr ON cr.card_id = c.id
       LEFT JOIN categories cat ON cat.id = cr.category_id
       WHERE c.id = $1 AND c.status = 'active'
       GROUP BY c.id, cc.name`,
      [id]
    );
    if (card.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    const row = card.rows[0];
    row.rates = row.rates || [];
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create card (admin)
router.post('/', async (req, res) => {
  try {
    const { name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes } = req.body;
    const result = await pool.query(
      `INSERT INTO cards (name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW()) RETURNING *`,
      [name, bank, card_category, annual_fee, fee_notes, min_salary, status || 'active', apply_link, key_benefits, eligibility_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update card (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes } = req.body;
    const result = await pool.query(
      `UPDATE cards SET name=$1, bank=$2, card_category=$3, annual_fee=$4, fee_notes=$5, min_salary=$6, status=$7, apply_link=$8, key_benefits=$9, eligibility_notes=$10
       WHERE id=$11 RETURNING *`,
      [name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE card (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cards WHERE id=$1', [id]);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET benchmarks by income bracket
router.get('/benchmarks/:bracket', async (req, res) => {
  try {
    const { bracket } = req.params;
    const result = await pool.query(
      `SELECT sb.*, cat.name AS category_name, cat.label AS category_label
       FROM spending_benchmarks sb
       JOIN categories cat ON cat.id = sb.category_id
       WHERE sb.income_bracket = $1`,
      [bracket]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calculate — rank all active cards by net annual savings for a given spending profile
const calculateHandler = async (req, res) => {
  try {
    const { spending, income } = req.body;
    if (!spending || typeof spending !== 'object') {
      return res.status(400).json({ error: 'spending object is required' });
    }

    const { rows: cards } = await pool.query(
      `SELECT c.id, c.name, c.bank, c.card_category, c.annual_fee, c.fee_notes, c.min_salary, c.max_cap, c.image_url, c.apply_link, c.updated_at,
          cc.name AS category_name,
          json_agg(
            json_build_object(
              'category_slug', cat.slug,
              'cashback_rate', cr.cashback_rate,
              'monthly_cap', cr.monthly_cap
            )
          ) AS rates
        FROM cards c
        LEFT JOIN card_categories cc ON cc.slug = c.card_category
        LEFT JOIN card_rates cr ON cr.card_id = c.id
        LEFT JOIN categories cat ON cat.id = cr.category_id
        WHERE c.status = 'active'
        GROUP BY c.id, cc.name`
    );

    const allResults = cards.map((card) => {
      const rates = (card.rates || []).filter((r) => r.category_slug !== null);
      const breakdown = {};
      const breakdownUncapped = {};
      let totalMonthlyCashback = 0;

      for (const [category, monthlySpend] of Object.entries(spending)) {
        const rate = rates.find((r) => r.category_slug === category);
        if (!rate) continue;

        const monthlyCap = rate.monthly_cap != null ? Number(rate.monthly_cap) : Infinity;
        const raw = Number(monthlySpend) * Number(rate.cashback_rate);
        const monthlyCashback = Math.min(raw, monthlyCap);
        breakdown[category] = parseFloat((monthlyCashback * 12).toFixed(2));
        breakdownUncapped[category] = parseFloat((raw * 12).toFixed(2));
        totalMonthlyCashback += monthlyCashback;
      }

      const cardMaxCap = card.max_cap != null && Number(card.max_cap) > 0 ? Number(card.max_cap) : Infinity;
      const totalAnnualCashback = parseFloat((Math.min(totalMonthlyCashback, cardMaxCap) * 12).toFixed(2));
      const annualFee = Number(card.annual_fee) || 0;
      const netAnnualSavings = parseFloat((totalAnnualCashback - annualFee).toFixed(2));

      return {
        id: card.id,
        name: card.name,
        bank: card.bank,
        card_category: card.card_category,
        category_name: card.category_name,
        annual_fee: card.annual_fee,
        fee_notes: card.fee_notes,
        min_salary: card.min_salary,
        max_cap: card.max_cap || null,
        image_url: card.image_url,
        apply_link: card.apply_link,
        updated_at: card.updated_at,
        net_annual_savings: netAnnualSavings,
        total_annual_cashback: totalAnnualCashback,
        cashback_breakdown: breakdown,
        cashback_breakdown_uncapped: breakdownUncapped,
      };
    });

    const allRanked = [...allResults].sort((a, b) => b.net_annual_savings - a.net_annual_savings);

    let userDob = null;
    if (req.user?.id) {
      const dobRes = await pool.query('SELECT date_of_birth FROM users WHERE id = $1', [req.user.id]);
      userDob = dobRes.rows[0]?.date_of_birth || null;
    }

    const userContext = { income, spending, date_of_birth: userDob };
    const top3Cards = [];
    const rankingCards = [];
    const hiddenFromTop3 = [];

    for (const card of allRanked) {
      const hardCheck = await isHardEligible(card, userContext);
      if (!hardCheck.eligible) {
        hiddenFromTop3.push({ id: card.id, name: card.name, reason: hardCheck.reason });
        continue;
      }

      rankingCards.push(card);

      const softCheck = await evaluateHideRules(card, userContext);
      if (softCheck.hidden) {
        hiddenFromTop3.push({ id: card.id, name: card.name, reason: softCheck.reason, soft: true });
      } else {
        top3Cards.push(card);
      }
    }

    const minSalaryRes = await pool.query(
      "SELECT MIN(min_salary) AS min_salary FROM cards WHERE status = 'active' AND min_salary > 0"
    );
    const platformMinSalary = minSalaryRes.rows[0]?.min_salary || 5000;

    res.json({
      cards: top3Cards,
      ranking_cards: rankingCards,
      all_cards: allRanked,
      hidden_cards: hiddenFromTop3,
      hidden_count: hiddenFromTop3.length,
      platform_min_salary: Number(platformMinSalary),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/calculate', optionalUserAuth, calculateHandler);

// POST /api/compare — calculate for specific card_ids only
const compareHandler = async (req, res) => {
  try {
    const { card_ids, spending } = req.body;

    if (!spending || typeof spending !== 'object') {
      return res.status(400).json({ error: 'spending object is required' });
    }

    let query = `
      SELECT c.id, c.name, c.bank, c.card_category, c.annual_fee, c.fee_notes, c.min_salary, c.max_cap, c.key_benefits, c.image_url, c.apply_link, c.updated_at,
        cc.name AS category_name,
        json_agg(
          json_build_object(
            'category_slug', cat.slug,
            'cashback_rate', cr.cashback_rate,
            'monthly_cap', cr.monthly_cap
          )
        ) AS rates
      FROM cards c
      LEFT JOIN card_categories cc ON cc.slug = c.card_category
      LEFT JOIN card_rates cr ON cr.card_id = c.id
      LEFT JOIN categories cat ON cat.id = cr.category_id
      WHERE c.status = 'active'
    `;
    const params = [];
    if (card_ids && card_ids.length > 0) {
      params.push(card_ids);
      query += ` AND c.id = ANY($1)`;
    }
    query += ' GROUP BY c.id, cc.name';

    const { rows: cards } = await pool.query(query, params);

    // Preserve requested order
    const orderedCards = (card_ids && card_ids.length > 0)
      ? card_ids.map((id) => cards.find((c) => c.id === id)).filter(Boolean)
      : cards;

    const results = orderedCards.map((card) => {
      const rates = (card.rates || []).filter((r) => r.category_slug !== null);
      const breakdown = {};
      const breakdownUncapped = {};
      let totalMonthlyCapped = 0;
      let totalMonthlyUncapped = 0;

      for (const [category, monthlySpend] of Object.entries(spending)) {
        const rate = rates.find((r) => r.category_slug === category);
        if (!rate) continue;

        const raw = Number(monthlySpend) * Number(rate.cashback_rate);
        const monthlyCap = rate.monthly_cap != null ? Number(rate.monthly_cap) : Infinity;
        const monthlyCashback = Math.min(raw, monthlyCap);

        breakdown[category] = parseFloat((monthlyCashback * 12).toFixed(2));
        breakdownUncapped[category] = parseFloat((raw * 12).toFixed(2));
        totalMonthlyCapped += monthlyCashback;
        totalMonthlyUncapped += raw;
      }

      const cardMaxCap = card.max_cap != null && Number(card.max_cap) > 0 ? Number(card.max_cap) : Infinity;
      const totalCapped = parseFloat((Math.min(totalMonthlyCapped, cardMaxCap) * 12).toFixed(2));
      const totalUncapped = parseFloat((totalMonthlyUncapped * 12).toFixed(2));

      const annualFee = Number(card.annual_fee) || 0;

      return {
        id: card.id,
        name: card.name,
        bank: card.bank,
        card_category: card.card_category,
        category_name: card.category_name,
        annual_fee: card.annual_fee,
        fee_notes: card.fee_notes,
        min_salary: card.min_salary,
        key_benefits: card.key_benefits,
        image_url: card.image_url,
        apply_link: card.apply_link,
        updated_at: card.updated_at,
        net_annual_savings: parseFloat((totalCapped - annualFee).toFixed(2)),
        total_annual_cashback: parseFloat(totalCapped.toFixed(2)),
        uncapped_annual_cashback: parseFloat(totalUncapped.toFixed(2)),
        cashback_breakdown: breakdown,
        cashback_breakdown_uncapped: breakdownUncapped,
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/compare', compareHandler);

router.get('/card-categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT slug, name FROM card_categories ORDER BY sort_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.optionalUserAuth = optionalUserAuth;
module.exports.calculateHandler = calculateHandler;
module.exports.compareHandler = compareHandler;
