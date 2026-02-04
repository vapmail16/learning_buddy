#!/usr/bin/env node
/**
 * Replace a stale uploadId in a note's blocks with the correct uploadId.
 * Use when the note references an upload id that doesn't exist (e.g. 19) but the
 * same file exists under another id (e.g. 12).
 *
 * Usage: cd backend && node scripts/fix-note-block-upload-id.js <sessionId> <oldUploadId> <newUploadId>
 * Example: node scripts/fix-note-block-upload-id.js 1 19 12
 */

require('dotenv').config();
const { Pool } = require('pg');

const DB_URL = process.env.DATABASE_URL || process.env.REMOTE_DATABASE_URL;
const sessionId = process.argv[2];
const oldId = process.argv[3];
const newId = process.argv[4];

if (!DB_URL || !sessionId || !oldId || !newId) {
  console.error('Usage: node scripts/fix-note-block-upload-id.js <sessionId> <oldUploadId> <newUploadId>');
  console.error('Example: node scripts/fix-note-block-upload-id.js 1 19 12');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });
const session = parseInt(sessionId, 10);
const oldUploadId = parseInt(oldId, 10);
const newUploadId = parseInt(newId, 10);

async function main() {
  const { rows } = await pool.query(
    'SELECT id, blocks FROM notes WHERE session_id = $1',
    [session]
  );
  if (!rows.length) {
    console.error('No note found for session', session);
    process.exit(1);
  }
  const note = rows[0];
  let blocks = note.blocks;
  if (!blocks || !Array.isArray(blocks)) {
    console.error('Note has no blocks');
    process.exit(1);
  }
  let changed = false;
  blocks = blocks.map((b) => {
    if (b && b.type === 'image' && b.uploadId === oldUploadId) {
      changed = true;
      return { ...b, uploadId: newUploadId };
    }
    return b;
  });
  if (!changed) {
    console.log('No block with uploadId', oldUploadId, 'found in note.');
    await pool.end();
    return;
  }
  await pool.query(
    'UPDATE notes SET blocks = $1, updated_at = current_timestamp WHERE id = $2',
    [JSON.stringify(blocks), note.id]
  );
  console.log('Updated note: replaced uploadId', oldUploadId, 'with', newUploadId, 'in', blocks.filter((b) => b && b.type === 'image' && b.uploadId === newUploadId).length, 'block(s).');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
