#!/usr/bin/env node
/**
 * Copy existing data from local database to remote (external) database.
 * Run after migrate-to-remote-db.js has created schema on remote.
 * Usage:
 *   LOCAL_DATABASE_URL=postgresql://localhost:5432/learning_buddy \
 *   REMOTE_DATABASE_URL=postgresql://... \
 *   node scripts/migrate-data-to-remote.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const LOCAL_URL = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
const REMOTE_URL = process.env.REMOTE_DATABASE_URL || process.argv[2];

if (!LOCAL_URL || !REMOTE_URL) {
  console.error('Set LOCAL_DATABASE_URL and REMOTE_DATABASE_URL (or pass remote as first arg).');
  process.exit(1);
}

const TABLES = ['users', 'courses', 'sessions', 'uploads', 'notes'];
const JSONB_COLUMNS = ['table_data', 'highlights', 'blocks'];

async function copyTable(localPool, remotePool, tableName) {
  const { rows } = await localPool.query(`SELECT * FROM ${tableName}`);
  if (rows.length === 0) {
    console.log(`  ${tableName}: 0 rows (skip)`);
    return;
  }
  const columns = Object.keys(rows[0]);
  const colList = columns.join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${tableName} (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
  for (const row of rows) {
    const values = columns.map((c) => {
      const v = row[c];
      if (v == null) return v;
      if (JSONB_COLUMNS.includes(c) && typeof v === 'object') return JSON.stringify(v);
      return v;
    });
    await remotePool.query(insertSql, values);
  }
  console.log(`  ${tableName}: ${rows.length} rows copied`);
}

async function main() {
  const localPool = new Pool({ connectionString: LOCAL_URL });
  const remotePool = new Pool({ connectionString: REMOTE_URL });

  try {
    console.log('Copying data from local to remote...');
    for (const table of TABLES) {
      await copyTable(localPool, remotePool, table);
    }
    console.log('Data migration complete.');
  } finally {
    await localPool.end();
    await remotePool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
