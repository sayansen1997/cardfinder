const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: 'hi2u_Postgres',
  host: 'localhost',
  database: 'cardfiner',
  port: 5432,
});

bcrypt.hash('password', 10).then(async (hash) => {
  const r = await pool.query(
    'UPDATE users SET password=$1 WHERE email=$2 RETURNING id, email',
    [hash, 'olduser@test.com']
  );
  console.log('Updated:', r.rows);
  await pool.end();
});
