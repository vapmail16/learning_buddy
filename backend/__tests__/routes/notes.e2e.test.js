const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/db/pool');
const usersRepository = require('../../src/repositories/users.repository');
const coursesRepository = require('../../src/repositories/courses.repository');
const sessionsRepository = require('../../src/repositories/sessions.repository');
const bcrypt = require('bcrypt');

describe('Notes (e2e)', () => {
  let token;
  let sessionId;

  beforeAll(async () => {
    const user = await usersRepository.create({
      email: 'e2e-notes@example.com',
      passwordHash: await bcrypt.hash('pass', 10),
    });
    const course = await coursesRepository.create({ userId: user.id, name: 'Course' });
    const session = await sessionsRepository.create({ courseId: course.id, title: 'Session' });
    sessionId = session.id;
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'e2e-notes@example.com', password: 'pass' });
    token = login.body.token;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'e2e-notes@example.com'");
  });

  test('GET /notes/sessions/:sessionId returns note and uploads', async () => {
    const res = await request(app)
      .get(`/notes/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('note');
    expect(res.body).toHaveProperty('uploads');
    expect(Array.isArray(res.body.uploads)).toBe(true);
  });

  test('PUT /notes/sessions/:sessionId creates note and returns 200', async () => {
    const res = await request(app)
      .put(`/notes/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'My note', table_data: [], highlights: [] });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ content: 'My note', session_id: sessionId });
    expect(res.body.id).toBeDefined();
  });

  test('PUT /notes/sessions/:sessionId updates existing note', async () => {
    const res = await request(app)
      .put(`/notes/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated note' });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Updated note');
  });

  test('GET /notes/sessions/:sessionId without token returns 401', async () => {
    const res = await request(app).get(`/notes/sessions/${sessionId}`);
    expect(res.status).toBe(401);
  });

  test('GET /notes/sessions/:sessionId with invalid session returns 404', async () => {
    const res = await request(app)
      .get('/notes/sessions/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('GET /notes/sessions/:sessionId with invalid id returns 400', async () => {
    const res = await request(app)
      .get('/notes/sessions/not-a-number')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
