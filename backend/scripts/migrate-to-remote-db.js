#!/usr/bin/env node
/**
 * Run migrations on the remote (external) database and update .env.
 * Usage: REMOTE_DATABASE_URL="postgresql://..." node scripts/migrate-to-remote-db.js
 * Or set REMOTE_DATABASE_URL in .env.remote or pass as first arg.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pgMigrate = require('node-pg-migrate').default;

const REMOTE_URL = process.env.REMOTE_DATABASE_URL || process.argv[2];

if (!REMOTE_URL) {
  console.error('Usage: REMOTE_DATABASE_URL="postgresql://user:pass@host:port/db" node scripts/migrate-to-remote-db.js');
  console.error('Or: node scripts/migrate-to-remote-db.js "postgresql://..."');
  process.exit(1);
}

const backendDir = path.join(__dirname, '..');
const envPath = path.join(backendDir, '.env');

async function main() {
  console.log('Running migrations on remote database...');
  await pgMigrate({
    databaseUrl: REMOTE_URL,
    dir: path.join(backendDir, 'migrations'),
    direction: 'up',
  });
  console.log('Migrations completed on remote database.');

  // Backup and update .env
  if (fs.existsSync(envPath)) {
    const backup = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backup);
    console.log('Backed up .env to', path.basename(backup));
    let content = fs.readFileSync(envPath, 'utf8');
    const newLine = `DATABASE_URL=${REMOTE_URL.includes(' ') ? `"${REMOTE_URL}"` : REMOTE_URL}`;
    if (/^DATABASE_URL=/m.test(content)) {
      content = content.replace(/^DATABASE_URL=.*$/m, newLine);
    } else {
      content = `# Database (external - dcdeploy)\n${newLine}\n\n${content}`;
    }
    fs.writeFileSync(envPath, content);
    console.log('Updated .env with REMOTE_DATABASE_URL.');
  } else {
    fs.writeFileSync(
      envPath,
      `# Database (external)\nDATABASE_URL=${REMOTE_URL}\n\n# JWT (required)\n# JWT_SECRET=your-secret-min-32-chars\n\n# Optional\n# OPENAI_API_KEY=sk-...\n# PORT=3001\n`
    );
    console.log('Created .env with DATABASE_URL.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
