const pool = require('../config/db');
const { createUniqueSlug } = require('../utils/helpers');

async function findExercises(filters) {
  const { search, muscle_group, difficulty, equipment } = filters;
  const where = [];
  const params = [];

  if (search) {
    where.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (muscle_group) {
    where.push('muscle_group = ?');
    params.push(muscle_group);
  }

  if (difficulty) {
    where.push('difficulty = ?');
    params.push(difficulty);
  }

  if (equipment) {
    where.push('equipment LIKE ?');
    params.push(`%${equipment}%`);
  }

  const [rows] = await pool.execute(
    `SELECT * FROM exercises
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY name ASC`,
    params
  );

  return rows;
}

async function createExercise(data) {
  const conn = await pool.getConnection();

  try {
    const slug = await createUniqueSlug(conn, 'exercises', 'slug', data.name);

    const [result] = await conn.execute(
      `INSERT INTO exercises (name, slug, description, muscle_group, equipment, difficulty, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name.trim(),
        slug,
        data.description || null,
        data.muscle_group || null,
        data.equipment || null,
        data.difficulty || 'beginner',
        data.imageUrl || null,
      ]
    );

    return { exerciseId: result.insertId, slug };
  } finally {
    conn.release();
  }
}

module.exports = {
  findExercises,
  createExercise,
};
