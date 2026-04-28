const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, label, icon, default_spend, min_spend, max_spend
       FROM categories
       WHERE is_active = true
       ORDER BY display_order ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, label, display_order } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, label, display_order) VALUES ($1,$2,$3) RETURNING *',
      [name, label, display_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, label, display_order, is_active } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name=$1, label=$2, display_order=$3, is_active=$4 WHERE id=$5 RETURNING *',
      [name, label, display_order, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
