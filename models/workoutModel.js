const pool = require('../config/db');
const { createUniqueSlug, parseHashtags } = require('../utils/helpers');

async function replacePostExercises(conn, postId, exercises) {
  await conn.execute('DELETE FROM workout_post_exercises WHERE post_id = ?', [postId]);

  for (let index = 0; index < exercises.length; index++) {
    const item = exercises[index];
    const exerciseId = Number(item.exercise_id);
    const setCount = Number(item.set_count);

    if (!exerciseId || !setCount) {
      throw new Error('Each exercise needs exercise_id and set_count.');
    }

    await conn.execute(
      `INSERT INTO workout_post_exercises (
        post_id,
        exercise_id,
        exercise_order,
        set_count,
        reps,
        time_seconds,
        rest_between_sets_seconds,
        rest_after_exercise_seconds,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        postId,
        exerciseId,
        Number(item.exercise_order) || index + 1,
        setCount,
        item.reps === undefined || item.reps === '' ? null : Number(item.reps),
        item.time_seconds === undefined || item.time_seconds === '' ? null : Number(item.time_seconds),
        item.rest_between_sets_seconds === undefined || item.rest_between_sets_seconds === ''
          ? null
          : Number(item.rest_between_sets_seconds),
        item.rest_after_exercise_seconds === undefined || item.rest_after_exercise_seconds === ''
          ? null
          : Number(item.rest_after_exercise_seconds),
        item.notes || null,
      ]
    );
  }
}

async function replacePostHashtags(conn, postId, hashtags) {
  await conn.execute('DELETE FROM workout_post_hashtags WHERE post_id = ?', [postId]);
  const tags = parseHashtags(hashtags);

  for (const tag of tags) {
    await conn.execute('INSERT IGNORE INTO hashtags (tag) VALUES (?)', [tag]);
    const [rows] = await conn.execute('SELECT hashtag_id FROM hashtags WHERE tag = ?', [tag]);

    if (rows[0]) {
      await conn.execute(
        'INSERT IGNORE INTO workout_post_hashtags (post_id, hashtag_id) VALUES (?, ?)',
        [postId, rows[0].hashtag_id]
      );
    }
  }
}

async function getPostForEdit(conn, postId) {
  const [rows] = await conn.execute(
    `SELECT post_id, user_id FROM workout_posts WHERE post_id = ? AND is_deleted = FALSE`,
    [postId]
  );

  return rows[0] || null;
}


async function getWorkoutOwner(postId) {
  const [rows] = await pool.execute(
    `SELECT post_id, user_id FROM workout_posts WHERE post_id = ? AND is_deleted = FALSE`,
    [postId]
  );

  return rows[0] || null;
}

async function listWorkouts(filters) {
  const {
    search,
    goal,
    category,
    exercise,
    hashtag,
    username,
    difficulty,
    limit = 20,
    offset = 0,
  } = filters;

  const where = ['wp.is_deleted = FALSE', "wp.visibility = 'public'"];
  const params = [];

  if (search) {
    where.push('(wp.title LIKE ? OR wp.caption LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (goal) {
    where.push('(wg.slug = ? OR wg.name = ?)');
    params.push(goal, goal);
  }

  if (category) {
    where.push('(c.slug = ? OR c.name = ?)');
    params.push(category, category);
  }

  if (username) {
    where.push('u.username = ?');
    params.push(username);
  }

  if (difficulty) {
    where.push(`EXISTS (
      SELECT 1
      FROM workout_post_exercises wpe_diff
      JOIN exercises e_diff ON e_diff.exercise_id = wpe_diff.exercise_id
      WHERE wpe_diff.post_id = wp.post_id AND e_diff.difficulty = ?
    )`);
    params.push(difficulty);
  }

  if (exercise) {
    where.push(`EXISTS (
      SELECT 1
      FROM workout_post_exercises wpe_filter
      JOIN exercises e_filter ON e_filter.exercise_id = wpe_filter.exercise_id
      WHERE wpe_filter.post_id = wp.post_id
      AND (e_filter.slug = ? OR e_filter.name LIKE ?)
    )`);
    params.push(exercise, `%${exercise}%`);
  }

  if (hashtag) {
    const cleanTag = String(hashtag).replace(/^#/, '').toLowerCase();
    where.push(`EXISTS (
      SELECT 1
      FROM workout_post_hashtags wph_filter
      JOIN hashtags h_filter ON h_filter.hashtag_id = wph_filter.hashtag_id
      WHERE wph_filter.post_id = wp.post_id AND h_filter.tag = ?
    )`);
    params.push(cleanTag);
  }

  params.push(Number(limit), Number(offset));

  const [rows] = await pool.execute(
    `SELECT
      wp.post_id,
      wp.title,
      wp.slug,
      wp.caption,
      wp.image_url,
      wp.total_duration_minutes,
      wp.rest_between_exercises_seconds,
      wp.created_at,
      u.username,
      p.display_name,
      wg.name AS goal,
      c.name AS category,
      COUNT(DISTINCT l.user_id) AS like_count,
      COUNT(DISTINCT b.user_id) AS bookmark_count,
      COUNT(DISTINCT cm.comment_id) AS comment_count
     FROM workout_posts wp
     JOIN users u ON u.user_id = wp.user_id
     LEFT JOIN profiles p ON p.user_id = u.user_id
     LEFT JOIN workout_goals wg ON wg.goal_id = wp.goal_id
     LEFT JOIN categories c ON c.category_id = wp.category_id
     LEFT JOIN likes l ON l.post_id = wp.post_id
     LEFT JOIN bookmarks b ON b.post_id = wp.post_id
     LEFT JOIN comments cm ON cm.post_id = wp.post_id AND cm.is_deleted = FALSE
     WHERE ${where.join(' AND ')}
     GROUP BY wp.post_id
     ORDER BY wp.created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );

  return rows;
}

async function getWorkoutBySlug(slug) {
  const [postRows] = await pool.execute(
    `SELECT
      wp.*,
      u.username,
      p.display_name,
      wg.name AS goal,
      wg.slug AS goal_slug,
      c.name AS category,
      c.slug AS category_slug,
      COUNT(DISTINCT l.user_id) AS like_count,
      COUNT(DISTINCT b.user_id) AS bookmark_count
     FROM workout_posts wp
     JOIN users u ON u.user_id = wp.user_id
     LEFT JOIN profiles p ON p.user_id = u.user_id
     LEFT JOIN workout_goals wg ON wg.goal_id = wp.goal_id
     LEFT JOIN categories c ON c.category_id = wp.category_id
     LEFT JOIN likes l ON l.post_id = wp.post_id
     LEFT JOIN bookmarks b ON b.post_id = wp.post_id
     WHERE wp.slug = ? AND wp.is_deleted = FALSE
     GROUP BY wp.post_id`,
    [slug]
  );

  const post = postRows[0] || null;
  if (!post) return null;

  const [exercises] = await pool.execute(
    `SELECT
      wpe.workout_exercise_id,
      wpe.exercise_order,
      wpe.set_count,
      wpe.reps,
      wpe.time_seconds,
      wpe.rest_between_sets_seconds,
      wpe.rest_after_exercise_seconds,
      wpe.notes,
      e.exercise_id,
      e.name,
      e.slug,
      e.description,
      e.muscle_group,
      e.equipment,
      e.difficulty
     FROM workout_post_exercises wpe
     JOIN exercises e ON e.exercise_id = wpe.exercise_id
     WHERE wpe.post_id = ?
     ORDER BY wpe.exercise_order ASC`,
    [post.post_id]
  );

  const [hashtags] = await pool.execute(
    `SELECT h.tag
     FROM workout_post_hashtags wph
     JOIN hashtags h ON h.hashtag_id = wph.hashtag_id
     WHERE wph.post_id = ?
     ORDER BY h.tag ASC`,
    [post.post_id]
  );

  const [comments] = await pool.execute(
    `SELECT
      cm.comment_id,
      cm.content,
      cm.created_at,
      u.username,
      p.display_name
     FROM comments cm
     JOIN users u ON u.user_id = cm.user_id
     LEFT JOIN profiles p ON p.user_id = u.user_id
     WHERE cm.post_id = ? AND cm.is_deleted = FALSE
     ORDER BY cm.created_at ASC`,
    [post.post_id]
  );

  return {
    post,
    exercises,
    hashtags: hashtags.map((row) => row.tag),
    comments,
  };
}

async function createWorkoutPost(userId, data) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const slug = await createUniqueSlug(conn, 'workout_posts', 'slug', data.title);

    const [result] = await conn.execute(
      `INSERT INTO workout_posts (
        user_id,
        goal_id,
        category_id,
        title,
        slug,
        caption,
        image_url,
        total_duration_minutes,
        rest_between_exercises_seconds,
        visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.goal_id || null,
        data.category_id || null,
        data.title.trim(),
        slug,
        data.caption || null,
        data.imageUrl || null,
        data.total_duration_minutes === undefined || data.total_duration_minutes === ''
          ? null
          : Number(data.total_duration_minutes),
        data.rest_between_exercises_seconds === undefined || data.rest_between_exercises_seconds === ''
          ? null
          : Number(data.rest_between_exercises_seconds),
        data.visibility || 'public',
      ]
    );

    const postId = result.insertId;
    await replacePostExercises(conn, postId, data.exercises);
    await replacePostHashtags(conn, postId, data.hashtags);

    await conn.commit();
    return { postId, slug };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function updateWorkoutPost(postId, data) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const post = await getPostForEdit(conn, postId);
    if (!post) {
      await conn.rollback();
      return null;
    }

    let slug = null;
    if (data.title) {
      slug = await createUniqueSlug(conn, 'workout_posts', 'slug', data.title, 'post_id', postId);
    }

    await conn.execute(
      `UPDATE workout_posts
       SET
        goal_id = COALESCE(?, goal_id),
        category_id = COALESCE(?, category_id),
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        caption = COALESCE(?, caption),
        image_url = COALESCE(?, image_url),
        total_duration_minutes = COALESCE(?, total_duration_minutes),
        rest_between_exercises_seconds = COALESCE(?, rest_between_exercises_seconds),
        visibility = COALESCE(?, visibility)
       WHERE post_id = ?`,
      [
        data.goal_id || null,
        data.category_id || null,
        data.title || null,
        slug,
        data.caption || null,
        data.imageUrl || null,
        data.total_duration_minutes === undefined || data.total_duration_minutes === ''
          ? null
          : Number(data.total_duration_minutes),
        data.rest_between_exercises_seconds === undefined || data.rest_between_exercises_seconds === ''
          ? null
          : Number(data.rest_between_exercises_seconds),
        data.visibility || null,
        postId,
      ]
    );

    if (data.exercises !== undefined) {
      await replacePostExercises(conn, postId, data.exercises);
    }

    if (data.hashtags !== undefined) {
      await replacePostHashtags(conn, postId, data.hashtags);
    }

    await conn.commit();
    return { post, slug };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function softDeleteWorkoutPost(postId) {
  const conn = await pool.getConnection();

  try {
    const post = await getPostForEdit(conn, postId);
    if (!post) return null;

    await conn.execute('UPDATE workout_posts SET is_deleted = TRUE WHERE post_id = ?', [postId]);
    return post;
  } finally {
    conn.release();
  }
}

module.exports = {
  getPostForEdit,
  getWorkoutOwner,
  listWorkouts,
  getWorkoutBySlug,
  createWorkoutPost,
  updateWorkoutPost,
  softDeleteWorkoutPost,
};
