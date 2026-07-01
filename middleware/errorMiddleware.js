const multer = require('multer');

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Invalid referenced id. Check goal_id, category_id, exercise_id, or post_id.',
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate value.' });
  }

  res.status(500).json({ error: error.message || 'Server error.' });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
