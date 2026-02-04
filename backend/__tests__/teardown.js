const { pool } = require('../src/db/pool');

module.exports = async () => {
  try {
    await pool.end();
  } catch (e) {
    // ignore
  }
};
