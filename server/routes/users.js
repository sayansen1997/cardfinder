const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { upload } = require('../config/cloudinary');
const { JWT_SECRET } = require('../config/auth');

const USER_SECRET = JWT_SECRET;

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

// GET /me — returns user from DB with calculations count
router.get('/me', userAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.profile_picture,
        u.income_range, u.nationality, u.auth_provider, u.created_at, u.date_of_birth,
        COUNT(uc.id)::int AS calculations_count
       FROM users u
       LEFT JOIN user_calculations uc ON uc.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.json({ email: req.user.email });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /me — update full_name, income_range, nationality, date_of_birth
router.put('/me', userAuth, async (req, res) => {
  const { income_range, nationality, full_name, date_of_birth } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        income_range   = COALESCE($1, income_range),
        nationality    = COALESCE($2, nationality),
        full_name      = COALESCE($3, full_name),
        date_of_birth  = COALESCE($5, date_of_birth)
       WHERE id = $4
       RETURNING id, email, full_name, profile_picture, income_range, nationality, date_of_birth`,
      [income_range || null, nationality || null, full_name || null, req.user.id, date_of_birth || null]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /me — soft delete account
router.delete('/me', userAuth, async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );
    if (!userRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('DELETE FROM user_calculations WHERE user_id = $1', [userId]);

    await client.query(
      `UPDATE users SET
        password = NULL,
        profile_picture = NULL,
        google_id = NULL,
        deleted_at = NOW(),
        deletion_reason = 'User requested deletion',
        lead_status = 'Closed',
        admin_notes = COALESCE(admin_notes, '') || E'\\n[' || TO_CHAR(NOW(), 'DD Mon YYYY') || '] Account deleted by user.'
      WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  } finally {
    client.release();
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.deleted_at) {
      return res.status(401).json({
        error: 'This account no longer exists. Please sign up to create a new account.',
      });
    }

    if (user.auth_provider === 'google' && !user.password) {
      return res.status(401).json({
        error: 'This account was created with Google. Please use Google Sign In.',
      });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        income_range: user.income_range,
        nationality: user.nationality,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /calculations — save a calculation for the logged-in user
// Accepts either a standard calculator save or a compare-page save (type: 'compare')
router.post('/calculations', userAuth, async (req, res) => {
  const { type, monthly_income, spending, top_cards, net_savings, card_ids, results } = req.body;
  try {
    let savedMonthlyIncome, savedTopCards, savedNetSavings;
    if (type === 'compare') {
      savedMonthlyIncome = monthly_income || 0;
      savedTopCards = JSON.stringify({ type: 'compare', card_ids, top_cards, results });
      savedNetSavings = Array.isArray(results) && results.length > 0
        ? Math.max(...results.map((r) => Number(r.net_annual_savings) || 0))
        : 0;
    } else {
      savedMonthlyIncome = monthly_income;
      savedTopCards = JSON.stringify(top_cards);
      savedNetSavings = net_savings;
    }
    const result = await pool.query(
      `INSERT INTO user_calculations (user_id, monthly_income, spending, top_cards, net_savings, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [req.user.id, savedMonthlyIncome, JSON.stringify(spending), savedTopCards, savedNetSavings]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /calculations/:id — delete a calculation (owner only)
router.delete('/calculations/:id', userAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM user_calculations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Calculation not found or unauthorized' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete calculation error:', err);
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

// POST /me/profile-picture — upload via Cloudinary
router.post('/me/profile-picture', userAuth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  try {
    const imageUrl = req.file.path;
    await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2',
      [imageUrl, req.user.id]
    );
    res.json({ success: true, profile_picture: imageUrl });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// POST /register
router.post('/register', async (req, res) => {
  const { email, password, full_name, income_range, nationality, date_of_birth, consent, utm_source, utm_medium, utm_campaign } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (!consent) {
    return res.status(400).json({ error: 'You must accept the terms to continue' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await pool.query(
      'SELECT id, auth_provider, deleted_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existing.rows.length) {
      const existingUser = existing.rows[0];

      if (!existingUser.deleted_at) {
        if (existingUser.auth_provider === 'google') {
          return res.status(400).json({
            error: 'This email is registered with Google. Please use Google Sign In.',
          });
        }
        return res.status(400).json({ error: 'Email already registered. Please log in.' });
      }

      if (!req.body.reactivate) {
        return res.status(409).json({
          requires_reactivation: true,
          message: 'An account with this email was previously deleted. Would you like to reactivate it?',
          deleted_at: existingUser.deleted_at,
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await pool.query(
        `UPDATE users SET
          password = $1,
          full_name = COALESCE($2, full_name),
          income_range = COALESCE($3, income_range),
          nationality = COALESCE($4, nationality),
          auth_provider = 'email',
          deleted_at = NULL,
          deletion_reason = NULL,
          lead_status = 'New',
          admin_notes = COALESCE(admin_notes, '') || E'\\n[' || TO_CHAR(NOW(), 'DD Mon YYYY') || '] Account reactivated by user.'
        WHERE id = $5`,
        [passwordHash, full_name, income_range || null, nationality || null, existingUser.id]
      );

      const updatedUser = await pool.query(
        'SELECT id, email, full_name, income_range, nationality, profile_picture FROM users WHERE id = $1',
        [existingUser.id]
      );
      const user = updatedUser.rows[0];

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        reactivated: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          profile_picture: user.profile_picture,
          income_range: user.income_range,
          nationality: user.nationality,
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
        (email, password, full_name, income_range, nationality, date_of_birth, auth_provider,
         utm_source, utm_medium, utm_campaign, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'email', $7, $8, $9, NOW())
       RETURNING id, email, full_name, income_range, nationality, date_of_birth, profile_picture`,
      [normalizedEmail, passwordHash, full_name, income_range || null, nationality || null,
       date_of_birth || null, utm_source || null, utm_medium || null, utm_campaign || null]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        income_range: user.income_range,
        nationality: user.nationality,
        date_of_birth: user.date_of_birth || null,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/users/google-auth — Sign in or sign up via Google
router.post('/google-auth', async (req, res) => {
  const { credential, utm_source, utm_medium, utm_campaign, reactivate } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from Google' });
    }

    let user;
    let foundDeletedUser = null;

    // Check by google_id (active OR deleted)
    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [google_id]
    );

    if (userResult.rows.length) {
      const found = userResult.rows[0];
      if (found.deleted_at) {
        foundDeletedUser = found;
      } else {
        user = found;
      }
    } else {
      // No user with this google_id — check by email
      const emailCheck = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (emailCheck.rows.length) {
        const existingUser = emailCheck.rows[0];

        if (existingUser.deleted_at) {
          foundDeletedUser = existingUser;
        } else {
          // Active email account — link Google
          await pool.query(
            `UPDATE users SET
              google_id = $1,
              full_name = COALESCE(full_name, $2),
              profile_picture = COALESCE(profile_picture, $3),
              auth_provider = 'google'
            WHERE email = $4`,
            [google_id, name, picture, email]
          );
          user = existingUser;
          user.google_id = google_id;
          user.full_name = user.full_name || name;
          user.profile_picture = user.profile_picture || picture;
        }
      }
    }

    // Deleted account found — require explicit reactivation
    if (foundDeletedUser) {
      if (!reactivate) {
        return res.status(409).json({
          requires_reactivation: true,
          auth_method: 'google',
          message: 'An account with this email was previously deleted. Would you like to reactivate it?',
          deleted_at: foundDeletedUser.deleted_at,
          credential,
        });
      }

      // Reactivation confirmed
      await pool.query(
        `UPDATE users SET
          google_id = $1,
          full_name = COALESCE(full_name, $2),
          profile_picture = $3,
          auth_provider = 'google',
          deleted_at = NULL,
          deletion_reason = NULL,
          lead_status = 'New',
          admin_notes = COALESCE(admin_notes, '') || E'\\n[' || TO_CHAR(NOW(), 'DD Mon YYYY') || '] Account reactivated via Google sign-in.'
        WHERE id = $4`,
        [google_id, name, picture, foundDeletedUser.id]
      );

      const refetch = await pool.query('SELECT * FROM users WHERE id = $1', [foundDeletedUser.id]);
      user = refetch.rows[0];
    }

    // No user at all — create new
    if (!user) {
      const insertResult = await pool.query(
        `INSERT INTO users (email, google_id, full_name, profile_picture, auth_provider,
           utm_source, utm_medium, utm_campaign, created_at)
         VALUES ($1, $2, $3, $4, 'google', $5, $6, $7, NOW())
         RETURNING *`,
        [email, google_id, name, picture,
         utm_source || null, utm_medium || null, utm_campaign || null]
      );
      user = insertResult.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      reactivated: !!foundDeletedUser,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        income_range: user.income_range,
        nationality: user.nationality,
        date_of_birth: user.date_of_birth || null,
      },
      profile_complete: !!(user.income_range && user.nationality),
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

module.exports = router;
