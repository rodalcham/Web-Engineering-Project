const pool = require('../config/db');

async function createUser(conn, { username, email, passwordHash }) {
  const [result] = await conn.execute(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [username.trim(), email.trim().toLowerCase(), passwordHash]
  );

  return result.insertId;
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT user_id, username, email, password_hash, role
     FROM users
     WHERE email = ? AND is_deleted = FALSE`,
    [email.trim().toLowerCase()]
  );

  return rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail,
};
