#!/usr/bin/env node
/**
 * Drops the learning_buddy database.
 * Requires: PostgreSQL and .env with DATABASE_URL (or defaults to learning_buddy).
 */
require('dotenv').config();
const { execSync } = require('child_process');

const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/learning_buddy';
const dbName = url.split('/').pop().replace(/\?.*$/, '') || 'learning_buddy';

try {
  execSync(`dropdb "${dbName}"`, { stdio: 'inherit' });
  console.log(`Database "${dbName}" dropped.`);
} catch (e) {
  if (e.status === 1) {
    console.log(`Database "${dbName}" does not exist (or could not be dropped).`);
  } else {
    console.error(`Could not drop "${dbName}". Ensure PostgreSQL is running and no one is connected.`);
    process.exit(1);
  }
}
