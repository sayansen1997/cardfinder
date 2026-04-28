require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: 'localhost',
      port: 5432,
      database: 'cardfiner',
      user: 'postgres',
      password: 'hi2u_Postgres',
    });

module.exports = pool;
