function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220) || `post-${Date.now()}`;
}

function publicUploadPath(file) {
  return file ? `/public/uploads/${file.filename}` : null;
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function parseHashtags(value) {
  if (!value) return [];

  const rawTags = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((tag) => tag.trim());

  return [
    ...new Set(
      rawTags
        .map((tag) => String(tag).replace(/^#/, '').trim().toLowerCase())
        .filter(Boolean)
        .filter((tag) => tag.length <= 100)
    ),
  ];
}

async function createUniqueSlug(conn, tableName, columnName, title, ignoreIdColumn = null, ignoreId = null) {
  const base = slugify(title);
  let slug = base;
  let counter = 2;

  while (true) {
    let sql = `SELECT ${columnName} FROM ${tableName} WHERE ${columnName} = ?`;
    const params = [slug];

    if (ignoreIdColumn && ignoreId) {
      sql += ` AND ${ignoreIdColumn} <> ?`;
      params.push(ignoreId);
    }

    const [rows] = await conn.execute(sql, params);
    if (rows.length === 0) return slug;

    slug = `${base}-${counter++}`;
  }
}

module.exports = {
  slugify,
  publicUploadPath,
  parseJsonField,
  parseHashtags,
  createUniqueSlug,
};
