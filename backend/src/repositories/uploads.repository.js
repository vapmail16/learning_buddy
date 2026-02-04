const { pool } = require('../db/pool');

const uploadsRepository = {
  async create({ sessionId, filePath, originalFilename, fileType }) {
    const {
      rows: [row],
    } = await pool.query(
      `INSERT INTO uploads (session_id, file_path, original_filename, file_type) VALUES ($1, $2, $3, $4)
       RETURNING id, session_id, file_path, original_filename, file_type, created_at`,
      [sessionId, filePath, originalFilename, fileType || null]
    );
    return row;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, session_id, file_path, original_filename, file_type FROM uploads WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findBySession(sessionId) {
    const { rows } = await pool.query(
      'SELECT id, session_id, file_path, original_filename, file_type, created_at FROM uploads WHERE session_id = $1 ORDER BY created_at',
      [sessionId]
    );
    return rows;
  },
};

module.exports = uploadsRepository;
