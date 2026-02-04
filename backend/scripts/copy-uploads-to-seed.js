#!/usr/bin/env node
/**
 * Copy files from backend/public/uploads to backend/public/uploads-seed
 * so they can be committed and included in the Docker image.
 * Run from repo root or backend/: node backend/scripts/copy-uploads-to-seed.js
 */

const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..');
const uploadsDir = path.join(backendDir, 'public', 'uploads');
const seedDir = path.join(backendDir, 'public', 'uploads-seed');

if (!fs.existsSync(uploadsDir)) {
  console.log('No public/uploads folder, nothing to copy.');
  process.exit(0);
}

if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });

const files = fs.readdirSync(uploadsDir).filter((f) => f !== '.gitkeep' && f !== '.DS_Store');
if (files.length === 0) {
  console.log('No files in public/uploads (only .gitkeep). Nothing to copy.');
  process.exit(0);
}

let copied = 0;
for (const f of files) {
  const src = path.join(uploadsDir, f);
  if (!fs.statSync(src).isFile()) continue;
  fs.copyFileSync(src, path.join(seedDir, f));
  copied++;
  console.log('  copied:', f);
}
console.log(`Copied ${copied} file(s) to public/uploads-seed. Now run: git add backend/public/uploads-seed && git commit -m "Include upload images in image" && git push`);
