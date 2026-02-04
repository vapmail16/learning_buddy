#!/usr/bin/env node
/**
 * List uploads (id, file_path, session_id) from the database.
 * Use to see which file_path is stored for a given upload id (e.g. 19).
 * Usage: cd backend && node scripts/list-uploads.js
 *        Or: DATABASE_URL=postgresql://... node scripts/list-uploads.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const DB_URL = process.env.DATABASE_URL || process.env.REMOTE_DATABASE_URL;
if (!DB_URL) {
  console.error('Set DATABASE_URL (or REMOTE_DATABASE_URL) in backend/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });

async function main() {
  const sessionId = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const q = sessionId
    ? await pool.query('SELECT id, session_id, file_path, original_filename FROM uploads WHERE session_id = $1 ORDER BY id', [sessionId])
    : await pool.query('SELECT id, session_id, file_path, original_filename FROM uploads ORDER BY session_id, id');
  console.log('id | session_id | file_path | original_filename');
  console.log('---|------------|-----------|-------------------');
  for (const row of q.rows) {
    console.log(`${row.id} | ${row.session_id} | ${row.file_path} | ${row.original_filename || ''}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
