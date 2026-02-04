const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_TEST;

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_TEST must be set');
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = { pool };
