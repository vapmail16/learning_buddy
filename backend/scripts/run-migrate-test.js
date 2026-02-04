require('dotenv').config();
const path = require('path');
const pgMigrate = require('node-pg-migrate').default;

const databaseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL_TEST or DATABASE_URL must be set');
  process.exit(1);
}

async function run() {
  await pgMigrate({
    databaseUrl,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'up',
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
