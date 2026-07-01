const pool = require('../config/db');

async function createProfile(conn, { userId, displayName, username }) {
  await conn.execute(
    `INSERT INTO profiles (user_id, display_name, bio) VALUES (?, ?, ?)`,
    [userId, displayName || username, '']
  );
}

async function getProfileByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT
      u.user_id,
      u.username,
      p.display_name,
      p.bio,
      p.age,
      p.profile_picture_url,
      p.fitness_level,
      u.created_at
     FROM users u
     JOIN profiles p ON p.user_id = u.user_id
     WHERE u.username = ? AND u.is_deleted = FALSE`,
    [username]
  );

  return rows[0] || null;
}

async function updateMyProfile(userId, data) {
  const {
    displayName,
    bio,
    age,
    fitnessLevel,
    profilePictureUrl,
  } = data;

  await pool.execute(
    `UPDATE profiles
     SET
      display_name = COALESCE(?, display_name),
      bio = COALESCE(?, bio),
      age = COALESCE(?, age),
      fitness_level = COALESCE(?, fitness_level),
      profile_picture_url = COALESCE(?, profile_picture_url)
     WHERE user_id = ?`,
    [
      displayName || null,
      bio || null,
      age === undefined || age === '' ? null : Number(age),
      fitnessLevel || null,
      profilePictureUrl || null,
      userId,
    ]
  );
}

async function getPublicPostsForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
      wp.post_id,
      wp.title,
      wp.slug,
      wp.caption,
      wp.image_url,
      wp.created_at,
      wg.name AS goal,
      c.name AS category
     FROM workout_posts wp
     LEFT JOIN workout_goals wg ON wg.goal_id = wp.goal_id
     LEFT JOIN categories c ON c.category_id = wp.category_id
     WHERE wp.user_id = ? AND wp.is_deleted = FALSE AND wp.visibility = 'public'
     ORDER BY wp.created_at DESC`,
    [userId]
  );

  return rows;
}

module.exports = {
  createProfile,
  getProfileByUsername,
  updateMyProfile,
  getPublicPostsForUser,
};
