const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { upload } = require('../config/cloudinary');
const PDFDocument = require('pdfkit');

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
    const { page = 1, limit = 12, search, category, income, status } = req.query;
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
      conditions.push(`c.card_category = $${pi}`);
      params.push(category);
      pi++;
    }
    if (status) {
      conditions.push(`c.status = $${pi}`);
      params.push(status);
      pi++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM cards c ${where}`, params),
      pool.query(
        `SELECT c.id, c.name, c.bank, c.card_category, c.annual_fee, c.min_salary, c.status, c.created_at, c.image_url,
          cc.name AS category_name,
          (SELECT MAX(cr.monthly_cap) FROM card_rates cr WHERE cr.card_id = c.id) AS max_cap
         FROM cards c
         LEFT JOIN card_categories cc ON cc.slug = c.card_category
         ${where}
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

// GET /api/admin/cards/:id — full card with rates map
router.get('/cards/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const cardResult = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
    if (!cardResult.rows.length) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const ratesResult = await pool.query(
      `SELECT cat.slug, cat.name, cat.icon, cr.cashback_rate, cr.monthly_cap
       FROM card_rates cr
       JOIN categories cat ON cat.id = cr.category_id
       WHERE cr.card_id = $1`,
      [id]
    );

    const rates = {};
    ratesResult.rows.forEach((r) => {
      rates[r.slug] = {
        cashback_rate: r.cashback_rate,
        monthly_cap: r.monthly_cap,
        name: r.name,
        icon: r.icon,
      };
    });

    res.json({ ...cardResult.rows[0], rates });
  } catch (err) {
    console.error('Get card error:', err);
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

      let newRate, newCap, isNewFormat;
      if (typeof rateVal === 'object' && rateVal !== null) {
        isNewFormat = true;
        newRate = Number(rateVal.cashback_rate) || 0;
        newCap = (rateVal.monthly_cap === null || rateVal.monthly_cap === undefined)
          ? null
          : Number(rateVal.monthly_cap);
      } else {
        isNewFormat = false;
        newRate = Number(rateVal) || 0;
        newCap = null;
      }

      const oldRes = await client.query(
        'SELECT cashback_rate, monthly_cap FROM card_rates WHERE card_id = $1 AND category_id = $2',
        [id, cat.id]
      );
      const oldRate = oldRes.rows[0]?.cashback_rate ?? null;
      const oldCap = oldRes.rows[0]?.monthly_cap ?? null;

      await client.query(
        'DELETE FROM card_rates WHERE card_id = $1 AND category_id = $2',
        [id, cat.id]
      );
      if (newRate > 0) {
        await client.query(
          'INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES ($1, $2, $3, $4)',
          [id, cat.id, newRate, newCap]
        );
      }

      if (String(oldRate ?? '0') !== String(newRate)) {
        await client.query(
          `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
           VALUES ($1, 'card_rates', $2, $3, $4, NOW(), 'UPDATED CASHBACK', $5, $6)`,
          [req.admin.email, cat.name, String(oldRate ?? '0'), String(newRate), id, cardName]
        );
      }

      if (isNewFormat) {
        const oldCapStr = oldCap != null ? String(oldCap) : 'Unlimited';
        const newCapStr = newCap != null ? String(newCap) : 'Unlimited';
        if (oldCapStr !== newCapStr) {
          await client.query(
            `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
             VALUES ($1, 'card_rates', $2, $3, $4, NOW(), 'UPDATED CAP', $5, $6)`,
            [req.admin.email, `${cat.name} (cap)`, oldCapStr, newCapStr, id, cardName]
          );
        }
      }
    }

    await client.query('UPDATE cards SET updated_at = NOW() WHERE id = $1', [id]);
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
    const cardRes = await pool.query('SELECT name, bank FROM cards WHERE id = $1', [id]);
    if (!cardRes.rows.length) return res.status(404).json({ error: 'Card not found' });
    const { name: cardName, bank } = cardRes.rows[0];

    // Log before delete so card_id is still valid
    await pool.query(
      `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
       VALUES ($1, 'cards', 'card', $2, '', NOW(), 'CARD DELETED', $3, $4)`,
      [req.admin.email, `${cardName} (${bank})`, id, cardName]
    );

    await pool.query('DELETE FROM cards WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/cards
router.post('/cards', auth, upload.single('image'), async (req, res) => {
  const { name, bank, card_category, annual_fee, min_salary, key_benefits, rates } = req.body;

  if (!name || !bank) {
    return res.status(400).json({ error: 'name and bank are required' });
  }

  const image_url = req.file ? req.file.path : null;

  const benefitsStr = (key_benefits || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');

  const ratesObj = rates
    ? (typeof rates === 'string' ? JSON.parse(rates) : rates)
    : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cardRes = await client.query(
      `INSERT INTO cards (name, bank, card_category, annual_fee, min_salary, key_benefits, status, image_url, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'active',$7,NOW(),NOW()) RETURNING *`,
      [name, bank, card_category || 'cashback', Number(annual_fee) || 0, Number(min_salary) || 0, benefitsStr || null, image_url]
    );
    const card = cardRes.rows[0];

    if (ratesObj && typeof ratesObj === 'object') {
      const catsRes = await client.query('SELECT id, name, slug FROM categories');
      for (const [slug, rateVal] of Object.entries(ratesObj)) {
        const cat = catsRes.rows.find((c) => c.slug === slug || c.name === slug);
        if (!cat) continue;
        let newRate, newCap;
        if (typeof rateVal === 'object' && rateVal !== null) {
          newRate = parseFloat(rateVal.cashback_rate) || 0;
          newCap = (rateVal.monthly_cap !== null && rateVal.monthly_cap !== undefined && rateVal.monthly_cap !== '')
            ? Number(rateVal.monthly_cap)
            : null;
        } else {
          newRate = parseFloat(rateVal) || 0;
          newCap = null;
        }
        if (newRate > 0) {
          await client.query(
            'INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap) VALUES ($1,$2,$3,$4)',
            [card.id, cat.id, newRate, newCap]
          );
        }
      }
    }

    await client.query(
      `INSERT INTO audit_log (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
       VALUES ($1, 'cards', 'all', '', $2, NOW(), 'CARD CREATED', $3, $4)`,
      [req.admin.email, `Created card: ${name} (${bank})`, card.id, name]
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

// PUT /api/admin/cards/:id — edit full card details + optional new image
router.put('/cards/:id', auth, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const {
    name, bank, card_category, annual_fee, min_salary, max_cap,
    status, apply_link, fee_notes, key_benefits, eligibility_notes,
  } = req.body;

  try {
    // Fetch full old record for diff
    const existing = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Card not found' });
    }
    const old = existing.rows[0];

    const image_url = req.file ? req.file.path : old.image_url;
    const benefitsStr = key_benefits != null
      ? (key_benefits || '').split('\n').map((s) => s.trim()).filter(Boolean).join(', ')
      : null;

    await pool.query(
      `UPDATE cards SET
        name = COALESCE($1, name),
        bank = COALESCE($2, bank),
        card_category = COALESCE($3, card_category),
        annual_fee = COALESCE($4, annual_fee),
        min_salary = COALESCE($5, min_salary),
        max_cap = $6,
        status = COALESCE($7, status),
        apply_link = $8,
        fee_notes = $9,
        key_benefits = $10,
        eligibility_notes = $11,
        image_url = $12,
        updated_at = NOW()
       WHERE id = $13`,
      [
        name || null, bank || null, card_category || null,
        annual_fee ? Number(annual_fee) : null,
        min_salary ? Number(min_salary) : null,
        max_cap ? Number(max_cap) : null,
        status || null, apply_link || null,
        fee_notes || null, benefitsStr,
        eligibility_notes || null, image_url, id,
      ]
    );

    // Re-fetch updated record and log per-field diffs
    const updated = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
    const newCard = updated.rows[0];

    const fieldsToTrack = [
      'name', 'bank', 'card_category', 'annual_fee', 'min_salary',
      'max_cap', 'status', 'apply_link', 'fee_notes',
      'key_benefits', 'eligibility_notes', 'image_url',
    ];

    for (const field of fieldsToTrack) {
      const oldStr = old[field] == null ? '' : String(old[field]);
      const newStr = newCard[field] == null ? '' : String(newCard[field]);
      if (oldStr !== newStr) {
        await pool.query(
          `INSERT INTO audit_log
             (admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name)
           VALUES ($1, 'cards', $2, $3, $4, NOW(), $5, $6, $7)`,
          [
            req.admin.email, field,
            oldStr.substring(0, 500), newStr.substring(0, 500),
            field === 'image_url' ? 'IMAGE UPDATED' : 'FIELD UPDATED',
            id, newCard.name,
          ]
        );
      }
    }

    res.json({ success: true, image_url });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ——— Audit log ———

// GET /api/admin/audit/types — distinct action_type values
router.get('/audit/types', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT action_type
      FROM audit_log
      WHERE action_type IS NOT NULL
        AND action_type NOT IN ('ASSET UPDATE', 'MODIFIED APR')
      ORDER BY action_type ASC
    `);
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

// ——— Card Categories CRUD ———

router.get('/card-categories', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM card_categories ORDER BY sort_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/card-categories', auth, async (req, res) => {
  const { slug, name, sort_order } = req.body;
  if (!slug || !name) {
    return res.status(400).json({ error: 'slug and name are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO card_categories (slug, name, sort_order) VALUES ($1, $2, $3) RETURNING *`,
      [slug.toLowerCase().replace(/\s+/g, '_'), name, sort_order || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/card-categories/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, sort_order } = req.body;
  try {
    await pool.query(
      `UPDATE card_categories SET name = $1, sort_order = $2, updated_at = NOW() WHERE id = $3`,
      [name, sort_order || 0, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/card-categories/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const catRes = await pool.query('SELECT slug FROM card_categories WHERE id = $1', [id]);
    if (!catRes.rows.length) return res.status(404).json({ error: 'Not found' });
    const slug = catRes.rows[0].slug;

    const usageRes = await pool.query('SELECT COUNT(*) FROM cards WHERE card_category = $1', [slug]);
    const usageCount = parseInt(usageRes.rows[0].count);
    if (usageCount > 0) {
      return res.status(400).json({ error: `Cannot delete: ${usageCount} card(s) are using this category` });
    }

    await pool.query('DELETE FROM card_categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ——— Spending Categories CRUD ———

router.get('/spending-categories', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY display_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/spending-categories', auth, async (req, res) => {
  const { slug, name, icon, min_spend, max_spend, default_spend, sort_order } = req.body;
  if (!slug || !name) {
    return res.status(400).json({ error: 'slug and name are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const catRes = await client.query(
      `INSERT INTO categories (slug, name, label, icon, min_spend, max_spend, default_spend, display_order, is_active)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [
        slug.toLowerCase().replace(/\s+/g, '_'),
        name,
        icon || 'Circle',
        min_spend ?? 0,
        max_spend ?? 5000,
        default_spend ?? 500,
        sort_order ?? 0,
      ]
    );
    const newCat = catRes.rows[0];
    await client.query(
      `INSERT INTO card_rates (card_id, category_id, cashback_rate, monthly_cap)
       SELECT c.id, $1, 0, NULL FROM cards c
       WHERE NOT EXISTS (
         SELECT 1 FROM card_rates cr WHERE cr.card_id = c.id AND cr.category_id = $1
       )`,
      [newCat.id]
    );
    await client.query('COMMIT');
    res.json(newCat);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/spending-categories/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, icon, min_spend, max_spend, default_spend, sort_order } = req.body;
  try {
    await pool.query(
      `UPDATE categories SET
        name        = COALESCE($1, name),
        label       = COALESCE($1, label),
        icon        = COALESCE($2, icon),
        min_spend   = COALESCE($3, min_spend),
        max_spend   = COALESCE($4, max_spend),
        default_spend = COALESCE($5, default_spend),
        display_order = COALESCE($6, display_order)
       WHERE id = $7`,
      [name, icon, min_spend, max_spend, default_spend, sort_order, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/spending-categories/:id', auth, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const catRes = await client.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (!catRes.rows.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const usageRes = await client.query(
      `SELECT COUNT(*)::int AS in_use_count,
              COUNT(CASE WHEN cashback_rate > 0 THEN 1 END)::int AS active_count
       FROM card_rates
       WHERE category_id = $1`,
      [id]
    );
    const { active_count } = usageRes.rows[0];

    if (active_count > 0) {
      return res.status(400).json({
        error: `Cannot delete: ${active_count} card(s) have an active cashback rate set for "${catRes.rows[0].name}". Set all rates to 0 first, then delete.`,
      });
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM card_rates WHERE category_id = $1', [id]);
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete spending category error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ——— Lead Management ———

// GET /api/admin/leads — Paginated list
router.get('/leads', auth, async (req, res) => {
  const { page = 1, limit = 20, status, search, auth_provider, deleted, view = 'normal' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClauses = ['1=1'];
  let params = [];
  let paramIndex = 1;

  if (view === 'trash') {
    whereClauses.push('trashed_at IS NOT NULL');
  } else {
    whereClauses.push('trashed_at IS NULL');
  }

  if (status) {
    whereClauses.push(`lead_status = $${paramIndex++}`);
    params.push(status);
  }
  if (auth_provider) {
    whereClauses.push(`auth_provider = $${paramIndex++}`);
    params.push(auth_provider);
  }
  if (search) {
    whereClauses.push(`(email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (deleted === 'active') {
    whereClauses.push('deleted_at IS NULL');
  } else if (deleted === 'deleted') {
    whereClauses.push('deleted_at IS NOT NULL');
  }

  const where = `WHERE ${whereClauses.join(' AND ')}`;

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params),
      pool.query(
        `SELECT
          id, email, full_name, income_range, nationality,
          auth_provider, lead_status, admin_notes,
          utm_source, utm_medium, utm_campaign,
          created_at, deleted_at, deletion_reason,
          trashed_at, trashed_by, trash_reason, trash_notes,
          (SELECT COUNT(*) FROM user_calculations WHERE user_id = users.id) AS calculations_count
        FROM users
        ${where}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, parseInt(limit), offset]
      ),
    ]);

    res.json({
      total: countResult.rows[0].total,
      leads: dataResult.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/leads/export/csv — CSV export (must be before /:id)
router.get('/leads/export/csv', auth, async (req, res) => {
  const { status, auth_provider, search, deleted, view = 'normal' } = req.query;

  let whereClauses = ['1=1'];
  let params = [];
  let paramIndex = 1;

  if (view === 'trash') {
    whereClauses.push('trashed_at IS NOT NULL');
  } else {
    whereClauses.push('trashed_at IS NULL');
  }

  if (status) {
    whereClauses.push(`lead_status = $${paramIndex++}`);
    params.push(status);
  }
  if (auth_provider) {
    whereClauses.push(`auth_provider = $${paramIndex++}`);
    params.push(auth_provider);
  }
  if (search) {
    whereClauses.push(`(email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (deleted === 'active') {
    whereClauses.push('deleted_at IS NULL');
  } else if (deleted === 'deleted') {
    whereClauses.push('deleted_at IS NOT NULL');
  }

  const where = `WHERE ${whereClauses.join(' AND ')}`;

  try {
    const result = await pool.query(
      `SELECT
        id, email, full_name, income_range, nationality,
        auth_provider, lead_status, admin_notes,
        utm_source, utm_medium, utm_campaign,
        created_at, deleted_at, deletion_reason,
        trashed_at, trash_reason, trashed_by
      FROM users
      ${where}
      ORDER BY created_at DESC`,
      params
    );

    const headers = [
      'ID', 'Email', 'Full Name', 'Income Range', 'Nationality',
      'Auth Provider', 'Status', 'Admin Notes',
      'UTM Source', 'UTM Medium', 'UTM Campaign', 'Signup Date',
      'Deleted At', 'Deletion Reason',
      'Trashed At', 'Trash Reason', 'Trashed By',
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return /[",\n]/.test(str) ? `"${str}"` : str;
    };

    const rows = result.rows.map((r) => [
      r.id, r.email, r.full_name || '', r.income_range || '',
      r.nationality || '', r.auth_provider || '', r.lead_status || '',
      r.admin_notes || '', r.utm_source || '', r.utm_medium || '',
      r.utm_campaign || '',
      r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
      r.deleted_at ? new Date(r.deleted_at).toISOString().split('T')[0] : '',
      r.deletion_reason || '',
      r.trashed_at ? new Date(r.trashed_at).toISOString().split('T')[0] : '',
      r.trash_reason || '',
      r.trashed_by || '',
    ].map(escapeCSV).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `leads_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/leads/export/pdf — PDF export (must be before /:id)
router.get('/leads/export/pdf', auth, async (req, res) => {
  const { status, auth_provider, search, deleted, view = 'normal' } = req.query;

  let whereClauses = ['1=1'];
  let params = [];
  let paramIndex = 1;

  if (view === 'trash') {
    whereClauses.push('trashed_at IS NOT NULL');
  } else {
    whereClauses.push('trashed_at IS NULL');
  }

  if (status) {
    whereClauses.push(`lead_status = $${paramIndex++}`);
    params.push(status);
  }
  if (auth_provider) {
    whereClauses.push(`auth_provider = $${paramIndex++}`);
    params.push(auth_provider);
  }
  if (search) {
    whereClauses.push(`(email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (deleted === 'active') {
    whereClauses.push('deleted_at IS NULL');
  } else if (deleted === 'deleted') {
    whereClauses.push('deleted_at IS NOT NULL');
  }

  const where = `WHERE ${whereClauses.join(' AND ')}`;

  try {
    const result = await pool.query(
      `SELECT
        id, email, full_name, income_range, nationality,
        auth_provider, lead_status, admin_notes,
        utm_source, utm_medium, utm_campaign,
        created_at, deleted_at, trashed_at, trash_reason
      FROM users
      ${where}
      ORDER BY created_at DESC`,
      params
    );

    const filename = `leads_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fillColor('#0D1B2A').fontSize(22).font('Helvetica-Bold')
       .text('Card Finder — Lead Management Report', { align: 'left' });
    doc.moveDown(0.3);
    doc.fillColor('#6B7280').fontSize(10).font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`);
    doc.text(`Total Leads: ${result.rows.length}`);
    if (status) doc.text(`Status Filter: ${status}`);
    if (auth_provider) doc.text(`Auth Provider Filter: ${auth_provider}`);
    doc.moveDown(1);

    const statusCounts = result.rows.reduce((acc, r) => {
      acc[r.lead_status] = (acc[r.lead_status] || 0) + 1;
      return acc;
    }, {});

    doc.fillColor('#0D1B2A').fontSize(11).font('Helvetica-Bold').text('Status Summary:');
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    Object.entries(statusCounts).forEach(([s, c]) => { doc.text(`  • ${s}: ${c}`); });
    doc.moveDown(1);

    const tableTop = doc.y;
    const colWidths = [30, 110, 120, 50, 70, 60, 70, 80, 70, 70];
    const headers = ['ID', 'Name', 'Email', 'Income', 'Nationality', 'Provider', 'Status', 'UTM Source', 'UTM Medium', 'Date'];

    let x = 40;
    doc.fillColor('white').rect(40, tableTop, 760, 22).fillAndStroke('#0D1B2A', '#0D1B2A');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, x + 4, tableTop + 7, { width: colWidths[i] - 4, ellipsis: true });
      x += colWidths[i];
    });

    const statusColors = { 'New': '#3B82F6', 'Contacted': '#F59E0B', 'Qualified': '#10B981', 'Closed': '#6B7280', 'DELETED': '#DC2626', 'TRASHED': '#7C3AED' };
    let y = tableTop + 22;
    doc.font('Helvetica').fontSize(8);

    result.rows.forEach((r, idx) => {
      if (y > 540) {
        doc.addPage({ layout: 'landscape', margin: 40 });
        y = 40;
        doc.fillColor('white').rect(40, y, 760, 22).fillAndStroke('#0D1B2A', '#0D1B2A');
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
        x = 40;
        headers.forEach((h, i) => {
          doc.text(h, x + 4, y + 7, { width: colWidths[i] - 4, ellipsis: true });
          x += colWidths[i];
        });
        y += 22;
        doc.font('Helvetica').fontSize(8);
      }

      if (idx % 2 === 0) doc.fillColor('#F9FAFB').rect(40, y, 760, 20).fill();

      const statusLabel = r.trashed_at
        ? `TRASHED (${r.trash_reason || 'No reason'})`
        : r.deleted_at
          ? `DELETED (${new Date(r.deleted_at).toLocaleDateString()})`
          : (r.lead_status || '-');
      const cells = [
        String(r.id), r.full_name || '-', r.email,
        r.income_range || '-', r.nationality || '-', r.auth_provider || '-',
        statusLabel, r.utm_source || '-', r.utm_medium || '-',
        r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
      ];

      x = 40;
      cells.forEach((val, i) => {
        if (i === 6) {
          const colorKey = val.startsWith('TRASHED') ? 'TRASHED' : val.startsWith('DELETED') ? 'DELETED' : val;
          doc.fillColor(statusColors[colorKey] || '#6B7280').font('Helvetica-Bold');
        } else {
          doc.fillColor('#1F2937').font('Helvetica');
        }
        doc.text(String(val), x + 4, y + 6, { width: colWidths[i] - 4, ellipsis: true, lineBreak: false });
        x += colWidths[i];
      });

      y += 20;
    });

    doc.fontSize(8).fillColor('#9CA3AF')
       .text('Card Finder Admin — Confidential', 40, 560, { align: 'center', width: 760 });
    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/leads/:id/trash — Move lead to trash
router.post('/leads/:id/trash', auth, async (req, res) => {
  const { id } = req.params;
  const { reason, notes } = req.body;
  const adminUser = req.admin.email;

  const validReasons = ['Junk', 'Spam', 'Test Account', 'Bounced Email', 'Other'];
  if (!reason || !validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason. Must be one of: ' + validReasons.join(', ') });
  }

  try {
    const userRes = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [id]);
    if (!userRes.rows.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const trashNote = `\n[${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}] Moved to trash by ${adminUser} (Reason: ${reason})`;

    await pool.query(
      `UPDATE users SET
        trashed_at = NOW(),
        trashed_by = $1,
        trash_reason = $2,
        trash_notes = $3,
        admin_notes = COALESCE(admin_notes, '') || $4
      WHERE id = $5`,
      [adminUser, reason, notes || null, trashNote, id]
    );

    res.json({ success: true, message: 'Lead moved to trash' });
  } catch (err) {
    console.error('Trash lead error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/leads/:id/restore — Restore lead from trash
router.post('/leads/:id/restore', auth, async (req, res) => {
  const { id } = req.params;
  const adminUser = req.admin.email;

  try {
    const userRes = await pool.query(
      'SELECT email, trashed_at FROM users WHERE id = $1',
      [id]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (!userRes.rows[0].trashed_at) {
      return res.status(400).json({ error: 'Lead is not in trash' });
    }

    const restoreNote = `\n[${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}] Restored from trash by ${adminUser}`;

    await pool.query(
      `UPDATE users SET
        trashed_at = NULL,
        trashed_by = NULL,
        trash_reason = NULL,
        trash_notes = NULL,
        admin_notes = COALESCE(admin_notes, '') || $1
      WHERE id = $2`,
      [restoreNote, id]
    );

    res.json({ success: true, message: 'Lead restored from trash' });
  } catch (err) {
    console.error('Restore lead error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/leads/:id/permanent — Permanently delete (must be in trash first)
router.delete('/leads/:id/permanent', auth, async (req, res) => {
  const { id } = req.params;
  const adminUser = req.admin.email;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT email, full_name, trashed_at FROM users WHERE id = $1',
      [id]
    );

    if (!userRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    const user = userRes.rows[0];

    if (!user.trashed_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Lead must be in trash before permanent deletion. Move to trash first.',
      });
    }

    await client.query(
      `INSERT INTO audit_log
        (admin_user, table_name, field_name, old_value, new_value, action_type, changed_at)
       VALUES ($1, 'users', 'permanent_delete', $2, '', 'LEAD PURGED', NOW())`,
      [adminUser, `Permanently deleted lead: ${user.email} (${user.full_name || 'no name'})`]
    );

    await client.query('DELETE FROM user_calculations WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Lead permanently deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Permanent delete error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/admin/leads/:id — Update status / notes
router.put('/leads/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { lead_status, admin_notes } = req.body;

  const validStatuses = ['New', 'Contacted', 'Qualified', 'Closed'];
  if (lead_status && !validStatuses.includes(lead_status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await pool.query(
      `UPDATE users SET
        lead_status = COALESCE($1, lead_status),
        admin_notes = COALESCE($2, admin_notes)
      WHERE id = $3`,
      [lead_status, admin_notes, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ——— Hide Rules CRUD ———

router.get('/cards/:id/hide-rules', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, rule_type, rule_config, description, created_at FROM card_hide_rules WHERE card_id = $1 ORDER BY id',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cards/:id/hide-rules', auth, async (req, res) => {
  const { rule_type, rule_config, description } = req.body;

  const validTypes = ['category_sum_below', 'category_sum_above',
    'total_spend_below', 'total_spend_above', 'total_spend_range'];

  if (!validTypes.includes(rule_type)) {
    return res.status(400).json({ error: 'Invalid rule type' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO card_hide_rules (card_id, rule_type, rule_config, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, rule_type, JSON.stringify(rule_config), description || null]
    );

    await pool.query(
      `INSERT INTO audit_log
        (admin_user, table_name, field_name, old_value, new_value, action_type, card_id, changed_at)
       VALUES ($1, 'card_hide_rules', 'rule', '', $2, 'HIDE RULE ADDED', $3, NOW())`,
      [req.admin.email, JSON.stringify(rule_config), req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cards/:id/hide-rules/:ruleId', auth, async (req, res) => {
  const { rule_type, rule_config, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE card_hide_rules
       SET rule_type = $1, rule_config = $2, description = $3, updated_at = NOW()
       WHERE id = $4 AND card_id = $5 RETURNING *`,
      [rule_type, JSON.stringify(rule_config), description, req.params.ruleId, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cards/:id/hide-rules/:ruleId', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM card_hide_rules WHERE id = $1 AND card_id = $2',
      [req.params.ruleId, req.params.id]
    );

    await pool.query(
      `INSERT INTO audit_log
        (admin_user, table_name, field_name, old_value, new_value, action_type, card_id, changed_at)
       VALUES ($1, 'card_hide_rules', 'rule', 'deleted', '', 'HIDE RULE REMOVED', $2, NOW())`,
      [req.admin.email, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
