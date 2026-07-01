const profileModel = require('../models/profileModel');
const { publicUploadPath } = require('../utils/helpers');

async function getProfile(req, res, next) {
  try {
    const profile = await profileModel.getProfileByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const posts = await profileModel.getPublicPostsForUser(profile.user_id);
    res.json({ profile, posts });
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    await profileModel.updateMyProfile(req.session.user.user_id, {
      displayName: req.body.display_name,
      bio: req.body.bio,
      age: req.body.age,
      fitnessLevel: req.body.fitness_level,
      profilePictureUrl: publicUploadPath(req.file),
    });

    res.json({ message: 'Profile updated.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateMe,
};
