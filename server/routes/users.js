const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const USER_SECRET = process.env.JWT_SECRET || 'cardfiner_user_secret';

const userAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, USER_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Demo register — upserts into users table, returns JWT + name
router.post('/demo-register', async (req, res) => {
  const { name, email, income_range, nationality } = req.body;
  const userName = name || 'Ahmed';
  const userEmail = email || 'demo@cardfinder.ae';

  if (!income_range || !nationality) {
    return res.status(400).json({ error: 'income_range and nationality are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, income_range, nationality, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET income_range = $3, nationality = $4
       RETURNING id, name, email`,
      [userName, userEmail, income_range, nationality]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      USER_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, name: user.name, id: user.id });
  } catch (err) {
    console.error('Demo register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Legacy complete-profile — keeps user_profiles table working
router.post('/complete-profile', async (req, res) => {
  const { income_range, nationality } = req.body;
  if (!income_range || !nationality) {
    return res.status(400).json({ error: 'income_range and nationality are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO user_profiles (income_range, nationality, created_at)
       VALUES ($1, $2, NOW()) RETURNING id`,
      [income_range, nationality]
    );
    const token = jwt.sign(
      { id: result.rows[0].id, income_range, nationality, first_name: 'Ahmed' },
      USER_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ success: true, token });
  } catch (err) {
    console.error('complete-profile error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// GET /me — returns user from DB
router.get('/me', userAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, income_range, nationality FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      // Fallback: return JWT payload if user row not found
      return res.json({ name: req.user.name || 'there', email: req.user.email });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /login — look up user by email and issue JWT (demo: no password check)
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!result.rows.length) {
      return res.status(401).json({ error: 'No account found with that email. Please sign up.' });
    }
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      USER_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, name: user.name, id: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /calculations — save a calculation for the logged-in user
router.post('/calculations', userAuth, async (req, res) => {
  const { monthly_income, spending, top_cards, net_savings } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_calculations (user_id, monthly_income, spending, top_cards, net_savings, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [req.user.id, monthly_income, JSON.stringify(spending), JSON.stringify(top_cards), net_savings]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /calculations — list saved calculations for the logged-in user
router.get('/calculations', userAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM user_calculations WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
