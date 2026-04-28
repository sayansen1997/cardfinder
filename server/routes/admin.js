const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM admin_users WHERE email=$1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seed-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admin_users (email, password_hash, created_at) VALUES ($1,$2,NOW()) ON CONFLICT (email) DO UPDATE SET password_hash=$2 RETURNING id, email',
      [email, hash]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit-log', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 200');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ——— Card management ———

// GET /api/admin/cards?page=&limit=&search=&category=&income=
router.get('/cards', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, income } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const params = [];
    let pi = 1;

    if (search) {
      conditions.push(`(c.name ILIKE $${pi} OR c.bank ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }
    if (income) {
      conditions.push(`c.min_salary <= $${pi}`);
      params.push(Number(income));
      pi++;
    }
    if (category) {
      conditions.push(`EXISTS (
        SELECT 1 FROM card_rates cr2
        JOIN categories cat2 ON cat2.id = cr2.category_id
        WHERE cr2.card_id = c.id AND cat2.slug = $${pi}
      )`);
      params.push(category);
      pi++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM cards c ${where}`, params),
      pool.query(
        `SELECT c.id, c.name, c.bank, c.card_category, c.annual_fee, c.min_salary, c.status, c.created_at,
          (SELECT MAX(cr.monthly_cap) FROM card_rates cr WHERE cr.card_id = c.id) AS max_cap
         FROM cards c ${where}
         ORDER BY c.name
         LIMIT $${pi} OFFSET $${pi + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    res.json({
      cards: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/cards/:id/rates
router.get('/cards/:id/rates', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT cr.cashback_rate, cr.monthly_cap,
        cat.id AS category_id, cat.name AS category_name, cat.slug, cat.label, cat.icon
       FROM card_rates cr
       JOIN categories cat ON cat.id = cr.category_id
       WHERE cr.card_id = $1
       ORDER BY cat.display_order`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/cards/:id/rates
router.put('/cards/:id/rates', auth, async (req, res) => {
  const { id } = req.params;
  const { rates } = req.body;

  if (!rates || typeof rates !== 'object') {
    return res.status(400).json({ error: 'rates object required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const [catsRes, cardNameRes] = await Promise.all([
      client.query('SELECT id, name, slug FROM categories'),
      client.query('SELECT name FROM cards WHERE id = $1', [id]),
    ]);
    const cardName = cardNameRes.rows[0]?.name || '';

    for (const [slug, rateVal] of Object.entries(rates)) {
      const cat = catsRes.rows.find((c) => c.slug === slug || c.name === slug);
      if (!cat) continue;

      const oldRes = await client.query(
        'SELECT cashback_rate FROM card_rates WHERE card_id = $1 AND category_id = $2',
        [id, cat.id]
      );
      const oldVal = oldRes.rows[0]?.cashback_rate ?? null;
      const newRate = parseFloat(rateVal) || 0;

      await client.query(
        'DELETE FROM card_rates WHERE card_id = $1 AND category_id = $2',
        [id, cat.id]
      );
      if (newRate > 0) {
        await client.query(
          'INSERT INTO card_rates (card_id, category_id, cashback_rate) VALUES ($1, $2, $3)',
          [id, cat.id, newRate]
        );
      }

      if (String(oldVal ?? '0') !== String(newRate)) {
        await client.query(
          `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
           VALUES ($1, 'card_rates', $2, $3, $4, NOW(), 'UPDATED CASHBACK', $5, $6)`,
          [req.admin.email, cat.name, String(oldVal ?? '0'), String(newRate), id, cardName]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/admin/cards/:id
router.delete('/cards/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const cardRes = await pool.query('SELECT name FROM cards WHERE id = $1', [id]);
    if (!cardRes.rows.length) return res.status(404).json({ error: 'Card not found' });
    const cardName = cardRes.rows[0].name;

    await pool.query('DELETE FROM cards WHERE id = $1', [id]);

    await pool.query(
      `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_name)
       VALUES ($1, 'cards', 'card', $2, 'deleted', NOW(), 'ASSET UPDATE', $3)`,
      [req.admin.email, cardName, cardName]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/cards
router.post('/cards', auth, async (req, res) => {
  const { name, bank, card_category, annual_fee, min_salary, key_benefits, rates } = req.body;

  if (!name || !bank) {
    return res.status(400).json({ error: 'name and bank are required' });
  }

  // Convert newline-separated benefits to comma-separated string
  const benefitsStr = (key_benefits || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cardRes = await client.query(
      `INSERT INTO cards (name, bank, card_category, annual_fee, min_salary, key_benefits, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'active',NOW()) RETURNING *`,
      [name, bank, card_category || 'cashback', Number(annual_fee) || 0, Number(min_salary) || 0, benefitsStr || null]
    );
    const card = cardRes.rows[0];

    if (rates && typeof rates === 'object') {
      const catsRes = await client.query('SELECT id, name, slug FROM categories');
      for (const [slug, rateVal] of Object.entries(rates)) {
        const cat = catsRes.rows.find((c) => c.slug === slug || c.name === slug);
        if (!cat) continue;
        const newRate = parseFloat(rateVal) || 0;
        if (newRate > 0) {
          await client.query(
            'INSERT INTO card_rates (card_id, category_id, cashback_rate) VALUES ($1,$2,$3)',
            [card.id, cat.id, newRate]
          );
        }
      }
    }

    await client.query(
      `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
       VALUES ($1, 'cards', 'created', '', $2, NOW(), 'ASSET UPDATE', $3, $4)`,
      [req.admin.email, name, card.id, name]
    );

    await client.query('COMMIT');
    res.status(201).json(card);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ——— Audit log ———

// GET /api/admin/audit/types — distinct action_type values
router.get('/audit/types', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT action_type FROM audit_log WHERE action_type IS NOT NULL ORDER BY action_type'
    );
    res.json(result.rows.map((r) => r.action_type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit?page=&limit=&card=&type=&from=&to=&export=csv
router.get('/audit', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, card, type, from, to } = req.query;
    const exportCsv = req.query.export === 'csv';

    const conditions = [];
    const params = [];
    let pi = 1;

    if (card) {
      conditions.push(`(al.card_name ILIKE $${pi} OR al.field_name ILIKE $${pi})`);
      params.push(`%${card}%`);
      pi++;
    }
    if (type) {
      conditions.push(`al.action_type = $${pi}`);
      params.push(type);
      pi++;
    }
    if (from) {
      conditions.push(`al.changed_at >= $${pi}::date`);
      params.push(from);
      pi++;
    }
    if (to) {
      conditions.push(`al.changed_at < ($${pi}::date + interval '1 day')`);
      params.push(to);
      pi++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    if (exportCsv) {
      const result = await pool.query(
        `SELECT al.id, al.changed_at, al.action_type, al.card_name,
          al.field_name, al.old_value, al.new_value, al.admin_user
         FROM audit_log al ${where}
         ORDER BY al.changed_at DESC`,
        params
      );
      const headers = ['ID', 'Timestamp', 'Action Type', 'Card Name', 'Field Changed', 'Old Value', 'New Value', 'Admin'];
      const csvRows = result.rows.map((r) =>
        [r.id, r.changed_at ? new Date(r.changed_at).toISOString() : '', r.action_type || '',
          r.card_name || '', r.field_name || '', r.old_value || '', r.new_value || '', r.admin_user || '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
      return res.send([headers.join(','), ...csvRows].join('\n'));
    }

    const offset = (Number(page) - 1) * Number(limit);
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM audit_log al ${where}`, params),
      pool.query(
        `SELECT al.id, al.changed_at, al.action_type, al.card_id, al.card_name,
          al.field_name, al.old_value, al.new_value, al.admin_user
         FROM audit_log al ${where}
         ORDER BY al.changed_at DESC
         LIMIT $${pi} OFFSET $${pi + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    res.json({
      logs: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/card-types — distinct card_category values
router.get('/card-types', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT card_category FROM cards WHERE card_category IS NOT NULL ORDER BY card_category'
    );
    res.json(result.rows.map((r) => r.card_category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
