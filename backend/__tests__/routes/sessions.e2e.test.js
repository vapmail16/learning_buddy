const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/db/pool');
const usersRepository = require('../../src/repositories/users.repository');
const coursesRepository = require('../../src/repositories/courses.repository');
const bcrypt = require('bcrypt');

describe('Sessions (e2e)', () => {
  let token;
  let courseId;

  beforeAll(async () => {
    const user = await usersRepository.create({
      email: 'e2e-sessions@example.com',
      passwordHash: await bcrypt.hash('pass', 10),
    });
    const course = await coursesRepository.create({ userId: user.id, name: 'Course' });
    courseId = course.id;
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'e2e-sessions@example.com', password: 'pass' });
    token = login.body.token;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'e2e-sessions@example.com'");
  });

  test('POST /sessions creates session and returns 201', async () => {
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId, title: 'Session 1' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ course_id: courseId, title: 'Session 1' });
    expect(res.body.id).toBeDefined();
  });

  test('GET /sessions/:id returns session when owned', async () => {
    const createRes = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId, title: 'Get Me' });
    const id = createRes.body.id;
    const res = await request(app)
      .get(`/sessions/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, title: 'Get Me' });
  });

  test('PATCH /sessions/:id updates session', async () => {
    const createRes = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId, title: 'Patch Me' });
    const id = createRes.body.id;
    const res = await request(app)
      .patch(`/sessions/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Patched' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Patched');
  });

  test('DELETE /sessions/:id returns 204', async () => {
    const createRes = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId, title: 'Delete Me' });
    const id = createRes.body.id;
    const res = await request(app)
      .delete(`/sessions/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test('POST /sessions without course_id or title returns 400', async () => {
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId });
    expect(res.status).toBe(400);
  });

  test('POST /sessions with non-owned course returns 404', async () => {
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: 99999, title: 'X' });
    expect(res.status).toBe(404);
  });
});
