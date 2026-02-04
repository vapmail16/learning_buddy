/**
 * Optional dev seed: creates one user and one course if DB is empty.
 * Run after migrations: node -r dotenv/config scripts/seed.js
 */
require('dotenv').config();
const { pool } = require('../src/db/pool');

async function seed() {
  const { rows } = await pool.query('SELECT 1 FROM users LIMIT 1');
  if (rows.length > 0) {
    console.log('Seed skipped: users already exist.');
    await pool.end();
    return;
  }
  const {
    rows: [user],
  } = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['dev@example.com', 'dev-hash-placeholder']
  );
  await pool.query(
    'INSERT INTO courses (user_id, name) VALUES ($1, $2)',
    [user.id, 'Sample Course']
  );
  console.log('Seed done: dev@example.com user and Sample Course created.');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
