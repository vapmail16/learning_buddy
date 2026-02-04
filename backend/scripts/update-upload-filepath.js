#!/usr/bin/env node
/**
 * Update an upload row's file_path so it points to a filename that exists in public/uploads (e.g. seed file).
 * Use when the DB has the wrong file_path and the file on disk has a different name.
 *
 * Usage: cd backend && node scripts/update-upload-filepath.js <uploadId> <basename>
 * Example: node scripts/update-upload-filepath.js 19 1770080064334-WhatsApp_Image_2025-08-20_at_16.54.20_e581873c.jpg
 *
 * Requires DATABASE_URL or REMOTE_DATABASE_URL in env.
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

const DB_URL = process.env.DATABASE_URL || process.env.REMOTE_DATABASE_URL;
const uploadId = process.argv[2];
const basename = process.argv[3];

if (!DB_URL || !uploadId || !basename) {
  console.error('Usage: node scripts/update-upload-filepath.js <uploadId> <basename>');
  console.error('Example: node scripts/update-upload-filepath.js 19 1770080064334-WhatsApp_Image_2025-08-20_at_16.54.20_e581873c.jpg');
  process.exit(1);
}

// Sanitize: basename only, no path
const safe = path.basename(basename);
if (safe.includes('..') || !safe) {
  console.error('Invalid basename');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });
const newFilePath = `uploads/${safe}`;

async function main() {
  const id = parseInt(uploadId, 10);
  if (Number.isNaN(id)) {
    console.error('Invalid upload id');
    process.exit(1);
  }
  const { rowCount } = await pool.query(
    'UPDATE uploads SET file_path = $1 WHERE id = $2 RETURNING id',
    [newFilePath, id]
  );
  if (rowCount === 0) {
    console.error('No upload found with id', id);
    process.exit(1);
  }
  console.log('Updated upload', id, 'file_path to', newFilePath);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
