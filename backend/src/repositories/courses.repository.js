const { pool } = require('../db/pool');

const coursesRepository = {
  async create({ userId, name }) {
    const {
      rows: [row],
    } = await pool.query(
      'INSERT INTO courses (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name, created_at',
      [userId, name]
    );
    return row;
  },

  async findByUser(userId) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, created_at FROM courses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async findByIdAndUser(id, userId) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, created_at FROM courses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async update(id, userId, { name }) {
    const {
      rows: [row],
    } = await pool.query(
      'UPDATE courses SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, user_id, name, created_at',
      [name, id, userId]
    );
    return row || null;
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query('DELETE FROM courses WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
    return rowCount > 0;
  },
};

module.exports = coursesRepository;
