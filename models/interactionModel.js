const pool = require('../config/db');

async function toggleLike(userId, postId) {
  const [existing] = await pool.execute(
    'SELECT user_id FROM likes WHERE user_id = ? AND post_id = ?',
    [userId, postId]
  );

  if (existing.length) {
    await pool.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
    return false;
  }

  await pool.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
  return true;
}

async function toggleBookmark(userId, postId) {
  const [existing] = await pool.execute(
    'SELECT user_id FROM bookmarks WHERE user_id = ? AND post_id = ?',
    [userId, postId]
  );

  if (existing.length) {
    await pool.execute('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId]);
    return false;
  }

  await pool.execute('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [userId, postId]);
  return true;
}

async function getBookmarksForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
      wp.post_id,
      wp.title,
      wp.slug,
      wp.caption,
      wp.image_url,
      b.created_at AS bookmarked_at,
      u.username
     FROM bookmarks b
     JOIN workout_posts wp ON wp.post_id = b.post_id
     JOIN users u ON u.user_id = wp.user_id
     WHERE b.user_id = ? AND wp.is_deleted = FALSE
     ORDER BY b.created_at DESC`,
    [userId]
  );

  return rows;
}

async function recordShare({ userId, postId, platform }) {
  await pool.execute(
    `INSERT INTO shares (user_id, post_id, platform) VALUES (?, ?, ?)`,
    [userId || null, postId, platform || 'copy_link']
  );
}

module.exports = {
  toggleLike,
  toggleBookmark,
  getBookmarksForUser,
  recordShare,
};
