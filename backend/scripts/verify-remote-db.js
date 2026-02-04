#!/usr/bin/env node
/**
 * Verify external database has complete and accurate data from local.
 * Compares row counts and row content (by id) for users, courses, sessions, uploads, notes.
 *
 * Usage:
 *   LOCAL_DATABASE_URL=postgresql://localhost:5432/learning_buddy \
 *   REMOTE_DATABASE_URL=postgresql://... \
 *   node scripts/verify-remote-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const LOCAL_URL = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
const REMOTE_URL = process.env.REMOTE_DATABASE_URL || process.argv[2];

const TABLES = ['users', 'courses', 'sessions', 'uploads', 'notes'];
const JSONB_COLUMNS = ['table_data', 'highlights', 'blocks'];

function normalizeValue(v) {
  if (v == null) return null;
  if (typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function rowSignature(row, columns) {
  const parts = columns.map((c) => `${c}=${normalizeValue(row[c])}`);
  return parts.join('|');
}

async function getTableData(pool, tableName) {
  const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);
  return rows;
}

async function verifyTable(localPool, remotePool, tableName) {
  const [localRows, remoteRows] = await Promise.all([
    getTableData(localPool, tableName),
    getTableData(remotePool, tableName),
  ]);

  const localCount = localRows.length;
  const remoteCount = remoteRows.length;
  const countMatch = localCount === remoteCount;

  if (!countMatch) {
    return {
      table: tableName,
      ok: false,
      localCount,
      remoteCount,
      error: `Row count mismatch: local=${localCount}, remote=${remoteCount}`,
      details: [],
    };
  }

  const localById = new Map(localRows.map((r) => [r.id, r]));
  const remoteById = new Map(remoteRows.map((r) => [r.id, r]));
  const columns = localRows[0] ? Object.keys(localRows[0]) : [];
  const mismatches = [];

  for (const id of localById.keys()) {
    const localRow = localById.get(id);
    const remoteRow = remoteById.get(id);
    if (!remoteRow) {
      mismatches.push({ id, error: 'Missing in remote' });
      continue;
    }
    const localSig = rowSignature(localRow, columns);
    const remoteSig = rowSignature(remoteRow, columns);
    if (localSig !== remoteSig) {
      mismatches.push({
        id,
        error: 'Data mismatch',
        localPreview: columns.slice(0, 3).map((c) => `${c}=${String(localRow[c]).slice(0, 30)}`).join(', '),
        remotePreview: columns.slice(0, 3).map((c) => `${c}=${String(remoteRow[c]).slice(0, 30)}`).join(', '),
      });
    }
  }

  const missingInRemote = [...localById.keys()].filter((id) => !remoteById.has(id));
  const extraInRemote = [...remoteById.keys()].filter((id) => !localById.has(id));
  if (missingInRemote.length) mismatches.push(...missingInRemote.map((id) => ({ id, error: 'Missing in remote' })));
  if (extraInRemote.length) mismatches.push(...extraInRemote.map((id) => ({ id, error: 'Extra in remote (not in local)' })));

  return {
    table: tableName,
    ok: mismatches.length === 0 && countMatch,
    localCount,
    remoteCount,
    error: mismatches.length ? `${mismatches.length} row(s) differ` : null,
    details: mismatches.slice(0, 10),
  };
}

async function main() {
  if (!LOCAL_URL || !REMOTE_URL) {
    console.error('Set LOCAL_DATABASE_URL and REMOTE_DATABASE_URL (or pass remote as first arg).');
    process.exit(1);
  }

  const localPool = new Pool({ connectionString: LOCAL_URL });
  const remotePool = new Pool({ connectionString: REMOTE_URL });

  console.log('========================================');
  console.log('Verify: Local vs External DB');
  console.log('========================================\n');
  console.log('Local:  ', LOCAL_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('Remote: ', REMOTE_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  let allOk = true;
  const results = [];

  try {
    for (const table of TABLES) {
      const result = await verifyTable(localPool, remotePool, table);
      results.push(result);
      if (!result.ok) allOk = false;
    }

    for (const r of results) {
      const status = r.ok ? 'OK' : 'MISMATCH';
      console.log(`${r.table}: ${r.localCount} local, ${r.remoteCount} remote → ${status}`);
      if (r.error) {
        console.log(`  → ${r.error}`);
        if (r.details && r.details.length) {
          r.details.forEach((d) => console.log(`     id=${d.id}: ${d.error}`));
        }
      }
    }

    console.log('');
    console.log('========================================');
    if (allOk) {
      console.log('VERIFIED: External DB has complete and accurate data from local.');
    } else {
      console.log('ISSUES FOUND: See details above.');
      process.exit(1);
    }
    console.log('========================================');
  } finally {
    await localPool.end();
    await remotePool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
