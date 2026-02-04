#!/usr/bin/env node
/**
 * Fix PostgreSQL sequences after copying data from local to remote.
 * When you INSERT data with explicit IDs (e.g. from migrate-data-to-remote.js),
 * the sequences for id columns are not updated. The next INSERT then gets an id
 * that already exists → "duplicate key value violates unique constraint".
 *
 * Run this once against the remote DB after running migrate-data-to-remote.js.
 *
 * Usage:
 *   REMOTE_DATABASE_URL=postgresql://... node scripts/fix-sequences-after-migrate.js
 * Or with backend/.env already pointing at remote:
 *   cd backend && node scripts/fix-sequences-after-migrate.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const DB_URL = process.env.REMOTE_DATABASE_URL || process.env.DATABASE_URL || process.argv[2];

if (!DB_URL) {
  console.error('Usage: REMOTE_DATABASE_URL=postgresql://... node scripts/fix-sequences-after-migrate.js');
  console.error('Or set DATABASE_URL in backend/.env and run from backend/');
  process.exit(1);
}

const TABLES_WITH_ID = ['users', 'courses', 'sessions', 'uploads', 'notes'];

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  try {
    for (const table of TABLES_WITH_ID) {
      const seqName = `${table}_id_seq`;
      await pool.query(
        `SELECT setval(
          pg_get_serial_sequence($1, 'id'),
          (SELECT COALESCE(MAX(id), 0) FROM ${table})
        )`,
        [table]
      );
      const nextVal = await pool.query(`SELECT last_value FROM ${seqName}`);
      console.log(`  ${table}: sequence set to next id = ${Number(nextVal.rows[0].last_value) + 1}`);
    }
    console.log('Sequences updated. New inserts will no longer conflict with existing ids.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
