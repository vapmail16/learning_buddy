require('dotenv').config();

// Use test DB for all tests that need a pool
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
// JWT for auth tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-min-32-chars-for-signing';
