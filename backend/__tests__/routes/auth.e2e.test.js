const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/db/pool');

describe('Auth (e2e)', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-min-32-chars';
  });

  const authTestEmails = [
    'e2e-reg@example.com',
    'e2e-dup@example.com',
    'e2e-login@example.com',
    'e2e-bad@example.com',
    'e2e@example.com',
  ];
  afterEach(async () => {
    await pool.query(
      "DELETE FROM users WHERE email = ANY($1::text[])",
      [authTestEmails]
    );
  });

  afterAll(async () => {
    // Do not close pool; other e2e tests may still need it
  });

  describe('POST /auth/register', () => {
    test('creates user and returns 201 with id and email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'e2e-reg@example.com', password: 'pass123' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: 'e2e-reg@example.com' });
      expect(res.body.id).toBeDefined();
    });

    test('returns 400 when email or password missing', async () => {
      const res = await request(app).post('/auth/register').send({ email: 'e2e@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('returns 409 when email already registered', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'e2e-dup@example.com', password: 'pass' });
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'e2e-dup@example.com', password: 'other' });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    test('returns 200 with token and user when credentials valid', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'e2e-login@example.com', password: 'secret' });
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'e2e-login@example.com', password: 'secret' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({ email: 'e2e-login@example.com' });
    });

    test('returns 401 when password wrong', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'e2e-bad@example.com', password: 'secret' });
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'e2e-bad@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    test('returns 401 when user not found', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'any' });
      expect(res.status).toBe(401);
    });

    test('returns 400 when email or password missing', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'a@b.com' });
      expect(res.status).toBe(400);
    });
  });
});
