const pool = require('../config/db');

async function createComment({ userId, postId, content }) {
  const [result] = await pool.execute(
    `INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)`,
    [userId, postId, content.trim()]
  );

  return result.insertId;
}

async function getCommentOwner(commentId) {
  const [rows] = await pool.execute(
    'SELECT user_id FROM comments WHERE comment_id = ? AND is_deleted = FALSE',
    [commentId]
  );

  return rows[0] || null;
}

async function updateComment(commentId, content) {
  await pool.execute(
    'UPDATE comments SET content = ? WHERE comment_id = ?',
    [content.trim(), commentId]
  );
}

async function softDeleteComment(commentId) {
  await pool.execute('UPDATE comments SET is_deleted = TRUE WHERE comment_id = ?', [commentId]);
}

module.exports = {
  createComment,
  getCommentOwner,
  updateComment,
  softDeleteComment,
};
