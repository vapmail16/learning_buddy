const request = require('supertest');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

jest.mock('../../src/services/extraction.service', () => ({ extractFromFile: jest.fn() }));

const app = require('../../src/app');
const { pool } = require('../../src/db/pool');
const usersRepository = require('../../src/repositories/users.repository');
const coursesRepository = require('../../src/repositories/courses.repository');
const sessionsRepository = require('../../src/repositories/sessions.repository');
const { extractFromFile } = require('../../src/services/extraction.service');

describe('Uploads (e2e)', () => {
  let token;
  let sessionId;
  const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

  beforeAll(async () => {
    const user = await usersRepository.create({
      email: 'e2e-uploads@example.com',
      passwordHash: await bcrypt.hash('pass', 10),
    });
    const course = await coursesRepository.create({ userId: user.id, name: 'Course' });
    const session = await sessionsRepository.create({ courseId: course.id, title: 'Session' });
    sessionId = session.id;
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'e2e-uploads@example.com', password: 'pass' });
    token = login.body.token;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'e2e-uploads@example.com'");
  });

  test('POST /uploads/sessions/:sessionId with file returns 201 and metadata', async () => {
    const res = await request(app)
      .post(`/uploads/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake image'), { filename: 'test.png' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      session_id: sessionId,
      original_filename: 'test.png',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.file_path).toBeDefined();
  });

  test('POST /uploads/sessions/:sessionId without file returns 400', async () => {
    const res = await request(app)
      .post(`/uploads/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('file');
  });

  test('POST /uploads/sessions/:sessionId without token returns 401', async () => {
    const res = await request(app)
      .post(`/uploads/sessions/${sessionId}`)
      .attach('file', Buffer.from('x'), { filename: 'x.pdf' });
    expect(res.status).toBe(401);
  });

  test('POST /uploads/sessions/:sessionId with invalid session returns 404', async () => {
    const res = await request(app)
      .post('/uploads/sessions/99999')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('x'), { filename: 'x.pdf' });
    expect(res.status).toBe(404);
  });

  test('POST /uploads/sessions/:sessionId with image merges extraction into notes', async () => {
    extractFromFile.mockResolvedValue({
      content: 'e2e extracted text',
      table_data: [{ rows: [['A', 'B']] }],
      highlights: [{ text: 'highlight' }],
    });
    const pngBuf = Buffer.alloc(100);
    const res = await request(app)
      .post(`/uploads/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', pngBuf, { filename: 'note.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.notesUpdated).toBe(true);
    const notesRes = await request(app)
      .get(`/notes/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(notesRes.status).toBe(200);
    expect(notesRes.body.note).toBeDefined();
    expect(notesRes.body.note.content).toContain('e2e extracted text');
    expect(notesRes.body.note.table_data).toEqual([{ rows: [['A', 'B']] }]);
    expect(notesRes.body.note.highlights).toEqual([{ text: 'highlight' }]);
  });
});
