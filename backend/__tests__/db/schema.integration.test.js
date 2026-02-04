const { pool } = require('../../src/db/pool');

describe('Database schema (Phase 1)', () => {
  afterAll(async () => {
    // Do not close pool; e2e tests may still need it
  });

  async function getTableColumns(tableName) {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    return rows.map((r) => ({ name: r.column_name, type: r.data_type, nullable: r.is_nullable === 'YES' }));
  }

  test('users table exists with required columns', async () => {
    const cols = await getTableColumns('users');
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('email');
    expect(names).toContain('password_hash');
    expect(names).toContain('created_at');
    const emailCol = cols.find((c) => c.name === 'email');
    expect(emailCol).toBeDefined();
    expect(emailCol.nullable).toBe(false);
  });

  test('courses table exists with required columns', async () => {
    const cols = await getTableColumns('courses');
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('user_id');
    expect(names).toContain('name');
    expect(names).toContain('created_at');
  });

  test('sessions table exists with required columns', async () => {
    const cols = await getTableColumns('sessions');
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('course_id');
    expect(names).toContain('title');
    expect(names).toContain('session_date');
    expect(names).toContain('created_at');
  });

  test('uploads table exists with required columns', async () => {
    const cols = await getTableColumns('uploads');
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('session_id');
    expect(names).toContain('file_path');
    expect(names).toContain('original_filename');
    expect(names).toContain('file_type');
    expect(names).toContain('created_at');
  });

  test('notes table exists with required columns', async () => {
    const cols = await getTableColumns('notes');
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('session_id');
    expect(names).toContain('content');
    expect(names).toContain('table_data');
    expect(names).toContain('highlights');
    expect(names).toContain('updated_at');
  });

  test('foreign keys exist for courses.user_id -> users.id', async () => {
    const { rows } = await pool.query(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
       WHERE tc.table_name = 'courses' AND tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users'`
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  test('foreign keys exist for sessions.course_id -> courses.id', async () => {
    const { rows } = await pool.query(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
       WHERE tc.table_name = 'sessions' AND tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'courses'`
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  test('foreign keys exist for uploads.session_id -> sessions.id', async () => {
    const { rows } = await pool.query(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
       WHERE tc.table_name = 'uploads' AND tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'sessions'`
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  test('foreign keys exist for notes.session_id -> sessions.id', async () => {
    const { rows } = await pool.query(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
       WHERE tc.table_name = 'notes' AND tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'sessions'`
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  test('users.email has unique constraint', async () => {
    const { rows } = await pool.query(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'users' AND constraint_type = 'UNIQUE'`
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
