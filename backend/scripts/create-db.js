#!/usr/bin/env node
/**
 * Creates the learning_buddy database if it does not exist.
 * Requires: PostgreSQL and .env with DATABASE_URL (or defaults to learning_buddy).
 */
require('dotenv').config();
const { execSync } = require('child_process');

const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/learning_buddy';
const dbName = url.split('/').pop().replace(/\?.*$/, '') || 'learning_buddy';

try {
  execSync(`createdb "${dbName}"`, { stdio: 'pipe', encoding: 'utf8' });
  console.log(`Database "${dbName}" created.`);
} catch (e) {
  const msg = (e.stderr || e.stdout || '').toString();
  const alreadyExists = e.status === 2 || /already exists/i.test(msg);
  if (alreadyExists) {
    console.log(`Database "${dbName}" already exists.`);
  } else {
    console.error(`Could not create "${dbName}". Ensure PostgreSQL is running and you have permission.`);
    if (msg) console.error(msg.trim());
    process.exit(1);
  }
}
