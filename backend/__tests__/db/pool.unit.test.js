describe('DB pool (unit)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    process.env.DATABASE_URL_TEST = originalEnv.DATABASE_URL_TEST;
    jest.resetModules();
  });

  test('throws when DATABASE_URL and DATABASE_URL_TEST are not set', () => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_TEST;
    // Prevent dotenv from re-loading .env when pool is required
    jest.mock('dotenv', () => ({ config: () => {} }));
    expect(() => require('../../src/db/pool')).toThrow(
      'DATABASE_URL or DATABASE_URL_TEST must be set'
    );
  });

  test('uses DATABASE_URL when set', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/main';
    process.env.DATABASE_URL_TEST = 'postgresql://localhost/test';
    jest.resetModules();
    const { pool } = require('../../src/db/pool');
    expect(pool).toBeDefined();
  });
});
