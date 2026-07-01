const pool = require('../config/db');

async function getMetaData() {
  const [goals] = await pool.execute('SELECT * FROM workout_goals ORDER BY name');
  const [categories] = await pool.execute('SELECT * FROM categories ORDER BY name');
  const [hashtags] = await pool.execute('SELECT * FROM hashtags ORDER BY tag');

  return { goals, categories, hashtags };
}

module.exports = {
  getMetaData,
};
