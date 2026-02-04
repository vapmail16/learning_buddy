const { pool } = require('../db/pool');

const notesRepository = {
  async findBySession(sessionId) {
    const { rows } = await pool.query(
      'SELECT id, session_id, content, table_data, highlights, blocks, updated_at FROM notes WHERE session_id = $1',
      [sessionId]
    );
    return rows[0] || null;
  },

  async create(sessionId, { content, tableData, highlights, blocks }) {
    const {
      rows: [row],
    } = await pool.query(
      `INSERT INTO notes (session_id, content, table_data, highlights, blocks)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, session_id, content, table_data, highlights, blocks, updated_at`,
      [
        sessionId,
        content || null,
        tableData ? JSON.stringify(tableData) : null,
        highlights ? JSON.stringify(highlights) : null,
        blocks != null ? JSON.stringify(blocks) : null,
      ]
    );
    return row;
  },

  async update(id, { content, tableData, highlights, blocks }) {
    const params = [content ?? null, tableData != null ? JSON.stringify(tableData) : null, highlights != null ? JSON.stringify(highlights) : null, id];
    const setBlocks = blocks !== undefined;
    if (setBlocks) params.splice(3, 0, blocks != null ? JSON.stringify(blocks) : null);
    const { rows: [row] } = await pool.query(
      `UPDATE notes SET content = COALESCE($1, content), table_data = COALESCE($2, table_data), highlights = COALESCE($3, highlights)${setBlocks ? ', blocks = $4' : ''}, updated_at = current_timestamp
       WHERE id = $${setBlocks ? 5 : 4} RETURNING id, session_id, content, table_data, highlights, blocks, updated_at`,
      params
    );
    return row || null;
  },
};

module.exports = notesRepository;
