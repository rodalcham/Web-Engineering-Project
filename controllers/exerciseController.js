const exerciseModel = require('../models/exerciseModel');
const { publicUploadPath } = require('../utils/helpers');

async function listExercises(req, res, next) {
  try {
    const exercises = await exerciseModel.findExercises(req.query);
    res.json({ exercises });
  } catch (error) {
    next(error);
  }
}

async function createExercise(req, res, next) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Exercise name is required.' });
  }

  try {
    const created = await exerciseModel.createExercise({
      ...req.body,
      imageUrl: publicUploadPath(req.file),
    });

    res.status(201).json({
      message: 'Exercise created.',
      exercise_id: created.exerciseId,
      slug: created.slug,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listExercises,
  createExercise,
};
