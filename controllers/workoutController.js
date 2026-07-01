const workoutModel = require('../models/workoutModel');
const { canEditResource } = require('../middleware/authMiddleware');
const { parseJsonField, publicUploadPath } = require('../utils/helpers');

function parseWorkoutPayload(body, file) {
  return {
    title: body.title,
    caption: body.caption,
    goal_id: body.goal_id,
    category_id: body.category_id,
    total_duration_minutes: body.total_duration_minutes,
    rest_between_exercises_seconds: body.rest_between_exercises_seconds,
    visibility: body.visibility,
    imageUrl: publicUploadPath(file),
    exercises: body.exercises === undefined ? undefined : parseJsonField(body.exercises, []),
    hashtags: body.hashtags === undefined ? undefined : parseJsonField(body.hashtags, body.hashtags || []),
  };
}

function validateExerciseArray(exercises) {
  return Array.isArray(exercises) && exercises.length > 0;
}

async function listWorkouts(req, res, next) {
  try {
    const workouts = await workoutModel.listWorkouts(req.query);
    res.json({ workouts });
  } catch (error) {
    next(error);
  }
}

async function getWorkoutBySlug(req, res, next) {
  try {
    const data = await workoutModel.getWorkoutBySlug(req.params.slug);
    if (!data) return res.status(404).json({ error: 'Workout post not found.' });

    const { post } = data;

    if (post.visibility === 'private' && !canEditResource(req, post.user_id)) {
      return res.status(403).json({ error: 'This workout is private.' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createWorkout(req, res, next) {
  const data = parseWorkoutPayload(req.body, req.file);

  if (!data.title) {
    return res.status(400).json({ error: 'title is required.' });
  }

  if (!validateExerciseArray(data.exercises)) {
    return res.status(400).json({
      error: 'At least one exercise is required. Send exercises as a JSON array.',
      example: [
        {
          exercise_id: 1,
          set_count: 3,
          reps: 12,
          rest_between_sets_seconds: 60,
        },
      ],
    });
  }

  try {
    const created = await workoutModel.createWorkoutPost(req.session.user.user_id, data);

    res.status(201).json({
      message: 'Workout post created.',
      post_id: created.postId,
      slug: created.slug,
    });
  } catch (error) {
    next(error);
  }
}

async function updateWorkout(req, res, next) {
  const postId = Number(req.params.postId);

  try {
    const post = await workoutModel.getWorkoutOwner(postId);
    if (!post) return res.status(404).json({ error: 'Workout post not found.' });
    if (!canEditResource(req, post.user_id)) return res.status(403).json({ error: 'Not allowed.' });

    const data = parseWorkoutPayload(req.body, req.file);

    if (req.body.exercises !== undefined && !validateExerciseArray(data.exercises)) {
      return res.status(400).json({ error: 'exercises must be a non-empty JSON array.' });
    }

    const updated = await workoutModel.updateWorkoutPost(postId, data);
    if (!updated) return res.status(404).json({ error: 'Workout post not found.' });

    res.json({ message: 'Workout post updated.', slug: updated.slug });
  } catch (error) {
    next(error);
  }
}

async function deleteWorkout(req, res, next) {
  const postId = Number(req.params.postId);

  try {
    const post = await workoutModel.getWorkoutOwner(postId);
    if (!post) return res.status(404).json({ error: 'Workout post not found.' });
    if (!canEditResource(req, post.user_id)) return res.status(403).json({ error: 'Not allowed.' });

    await workoutModel.softDeleteWorkoutPost(postId);
    res.json({ message: 'Workout post deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listWorkouts,
  getWorkoutBySlug,
  createWorkout,
  updateWorkout,
  deleteWorkout,
};
