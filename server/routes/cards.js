const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all active cards with their rates
router.get('/', async (req, res) => {
  try {
    const cards = await pool.query(
      `SELECT c.*,
        json_agg(
          json_build_object(
            'category_id', cr.category_id,
            'category_name', cat.name,
            'cashback_rate', cr.cashback_rate,
            'monthly_cap', cr.monthly_cap
          )
        ) AS rates
       FROM cards c
       LEFT JOIN card_rates cr ON cr.card_id = c.id
       LEFT JOIN categories cat ON cat.id = cr.category_id
       WHERE c.status = 'active'
       GROUP BY c.id
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
      `SELECT c.*,
        json_agg(
          json_build_object(
            'category_id', cr.category_id,
            'category_name', cat.name,
            'cashback_rate', cr.cashback_rate,
            'monthly_cap', cr.monthly_cap
          )
        ) AS rates
       FROM cards c
       LEFT JOIN card_rates cr ON cr.card_id = c.id
       LEFT JOIN categories cat ON cat.id = cr.category_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    if (card.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    res.json(card.rows[0]);
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
    const { spending } = req.body;
    if (!spending || typeof spending !== 'object') {
      return res.status(400).json({ error: 'spending object is required' });
    }

    const { rows: cards } = await pool.query(
      `SELECT c.id, c.name, c.bank, c.card_category, c.annual_fee, c.fee_notes, c.min_salary,
          json_agg(
            json_build_object(
              'category_name', cat.name,
              'cashback_rate', cr.cashback_rate,
              'monthly_cap', cr.monthly_cap
            )
          ) AS rates
        FROM cards c
        LEFT JOIN card_rates cr ON cr.card_id = c.id
        LEFT JOIN categories cat ON cat.id = cr.category_id
        WHERE c.status = 'active'
        GROUP BY c.id`
    );

    const results = cards.map((card) => {
      const rates = (card.rates || []).filter((r) => r.category_name !== null);
      const breakdown = {};
      let totalAnnualCashback = 0;

      for (const [category, monthlySpend] of Object.entries(spending)) {
        const rate = rates.find((r) => r.category_name === category);
        if (!rate) continue;

        const monthlyCap = rate.monthly_cap != null ? Number(rate.monthly_cap) : Infinity;
        const monthlyCashback = Math.min(
          Number(monthlySpend) * Number(rate.cashback_rate),
          monthlyCap
        );
        const annualCashback = monthlyCashback * 12;
        breakdown[category] = parseFloat(annualCashback.toFixed(2));
        totalAnnualCashback += annualCashback;
      }

      totalAnnualCashback = parseFloat(totalAnnualCashback.toFixed(2));
      const annualFee = Number(card.annual_fee) || 0;
      const netAnnualSavings = parseFloat((totalAnnualCashback - annualFee).toFixed(2));

      return {
        id: card.id,
        name: card.name,
        bank: card.bank,
        card_category: card.card_category,
        annual_fee: card.annual_fee,
        fee_notes: card.fee_notes,
        min_salary: card.min_salary,
        net_annual_savings: netAnnualSavings,
        total_annual_cashback: totalAnnualCashback,
        cashback_breakdown: breakdown,
      };
    });

    results.sort((a, b) => b.net_annual_savings - a.net_annual_savings);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/calculate', calculateHandler);

// POST /api/compare — calculate for specific card_ids only
const compareHandler = async (req, res) => {
  try {
    const { card_ids, spending } = req.body;

    if (!spending || typeof spending !== 'object') {
      return res.status(400).json({ error: 'spending object is required' });
    }

    let query = `
      SELECT c.id, c.name, c.bank, c.card_category, c.annual_fee, c.fee_notes, c.min_salary, c.key_benefits,
        json_agg(
          json_build_object(
            'category_name', cat.name,
            'cashback_rate', cr.cashback_rate,
            'monthly_cap', cr.monthly_cap
          )
        ) AS rates
      FROM cards c
      LEFT JOIN card_rates cr ON cr.card_id = c.id
      LEFT JOIN categories cat ON cat.id = cr.category_id
      WHERE c.status = 'active'
    `;
    const params = [];
    if (card_ids && card_ids.length > 0) {
      params.push(card_ids);
      query += ` AND c.id = ANY($1)`;
    }
    query += ' GROUP BY c.id';

    const { rows: cards } = await pool.query(query, params);

    // Preserve requested order
    const orderedCards = (card_ids && card_ids.length > 0)
      ? card_ids.map((id) => cards.find((c) => c.id === id)).filter(Boolean)
      : cards;

    const results = orderedCards.map((card) => {
      const rates = (card.rates || []).filter((r) => r.category_name !== null);
      const breakdown = {};
      const breakdownUncapped = {};
      let totalCapped = 0;
      let totalUncapped = 0;

      for (const [category, monthlySpend] of Object.entries(spending)) {
        const rate = rates.find((r) => r.category_name === category);
        if (!rate) continue;

        const raw = Number(monthlySpend) * Number(rate.cashback_rate);
        const monthlyCap = rate.monthly_cap != null ? Number(rate.monthly_cap) : Infinity;
        const monthlyCashback = Math.min(raw, monthlyCap);

        breakdown[category] = parseFloat((monthlyCashback * 12).toFixed(2));
        breakdownUncapped[category] = parseFloat((raw * 12).toFixed(2));
        totalCapped += monthlyCashback * 12;
        totalUncapped += raw * 12;
      }

      const annualFee = Number(card.annual_fee) || 0;

      return {
        id: card.id,
        name: card.name,
        bank: card.bank,
        card_category: card.card_category,
        annual_fee: card.annual_fee,
        fee_notes: card.fee_notes,
        min_salary: card.min_salary,
        key_benefits: card.key_benefits,
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

module.exports = router;
module.exports.calculateHandler = calculateHandler;
module.exports.compareHandler = compareHandler;
