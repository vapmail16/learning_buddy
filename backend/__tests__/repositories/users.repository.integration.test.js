const { pool } = require('../../src/db/pool');
const usersRepository = require('../../src/repositories/users.repository');

describe('Users repository (Phase 1)', () => {
  afterEach(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test-%@example.com']);
  });

  afterAll(async () => {
    // Do not close pool; e2e tests may still need it
  });

  test('create inserts a user and returns id, email, created_at', async () => {
    const email = 'test-create@example.com';
    const passwordHash = 'hashed';
    const user = await usersRepository.create({ email, passwordHash });
    expect(user).toMatchObject({
      id: expect.any(Number),
      email,
      created_at: expect.any(Date),
    });
    expect(user.password_hash).toBeUndefined();
  });

  test('findByEmail returns user when exists', async () => {
    const email = 'test-find@example.com';
    const passwordHash = 'hash';
    await usersRepository.create({ email, passwordHash });
    const found = await usersRepository.findByEmail(email);
    expect(found).not.toBeNull();
    expect(found.email).toBe(email);
    expect(found.password_hash).toBe(passwordHash);
  });

  test('findByEmail returns null when not exists', async () => {
    const found = await usersRepository.findByEmail('nonexistent@example.com');
    expect(found).toBeNull();
  });

  test('create with duplicate email throws or returns error (unique constraint)', async () => {
    const email = 'test-duplicate@example.com';
    await usersRepository.create({ email, passwordHash: 'h1' });
    await expect(usersRepository.create({ email, passwordHash: 'h2' })).rejects.toThrow();
  });
});
