const { pool } = require('../db/pool');

const usersRepository = {
  async create({ email, passwordHash }) {
    const {
      rows: [row],
    } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );
    return row;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },
};

module.exports = usersRepository;
