const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/db/pool');
const usersRepository = require('../../src/repositories/users.repository');
const bcrypt = require('bcrypt');

describe('Courses (e2e)', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const user = await usersRepository.create({
      email: 'e2e-courses@example.com',
      passwordHash: await bcrypt.hash('pass', 10),
    });
    userId = user.id;
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'e2e-courses@example.com', password: 'pass' });
    token = login.body.token;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'e2e-courses@example.com'");
  });

  test('GET /courses without token returns 401', async () => {
    const res = await request(app).get('/courses');
    expect(res.status).toBe(401);
  });

  test('POST /courses creates course and returns 201', async () => {
    const res = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Course' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'My Course', user_id: userId });
    expect(res.body.id).toBeDefined();
  });

  test('GET /courses returns list scoped by user', async () => {
    const res = await request(app)
      .get('/courses')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c) => c.name === 'My Course')).toBe(true);
  });

  test('GET /courses/:id returns course when owned', async () => {
    const list = await request(app).get('/courses').set('Authorization', `Bearer ${token}`);
    const id = list.body[0].id;
    const res = await request(app)
      .get(`/courses/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: 'My Course' });
  });

  test('PATCH /courses/:id updates name', async () => {
    const list = await request(app).get('/courses').set('Authorization', `Bearer ${token}`);
    const id = list.body[0].id;
    const res = await request(app)
      .patch(`/courses/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Course' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Course');
  });

  test('GET /courses/:id/sessions returns sessions for course', async () => {
    const list = await request(app).get('/courses').set('Authorization', `Bearer ${token}`);
    const id = list.body[0].id;
    const res = await request(app)
      .get(`/courses/${id}/sessions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('DELETE /courses/:id returns 204', async () => {
    const createRes = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });
    const id = createRes.body.id;
    const res = await request(app)
      .delete(`/courses/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test('POST /courses without name returns 400', async () => {
    const res = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('GET /courses/:id with wrong id returns 404', async () => {
    const res = await request(app)
      .get('/courses/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('GET /courses with invalid token returns 401', async () => {
    const res = await request(app)
      .get('/courses')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('GET /courses with Authorization without Bearer returns 401', async () => {
    const res = await request(app)
      .get('/courses')
      .set('Authorization', 'Basic xxx');
    expect(res.status).toBe(401);
  });

  test('PATCH /courses/:id with non-existent id returns 404', async () => {
    const res = await request(app)
      .patch('/courses/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});
