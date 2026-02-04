const { pool } = require('../db/pool');

const sessionsRepository = {
  async create({ courseId, title, sessionDate }) {
    const {
      rows: [row],
    } = await pool.query(
      `INSERT INTO sessions (course_id, title, session_date) VALUES ($1, $2, $3)
       RETURNING id, course_id, title, session_date, created_at`,
      [courseId, title, sessionDate || null]
    );
    return row;
  },

  async findByCourse(courseId) {
    const { rows } = await pool.query(
      'SELECT id, course_id, title, session_date, created_at FROM sessions WHERE course_id = $1 ORDER BY session_date DESC NULLS LAST, created_at DESC',
      [courseId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, course_id, title, session_date, created_at FROM sessions WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async update(id, { title, sessionDate }) {
    const {
      rows: [row],
    } = await pool.query(
      `UPDATE sessions SET title = $1, session_date = $2 WHERE id = $3
       RETURNING id, course_id, title, session_date, created_at`,
      [title, sessionDate ?? null, id]
    );
    return row || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = sessionsRepository;
