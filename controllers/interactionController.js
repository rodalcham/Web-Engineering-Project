const interactionModel = require('../models/interactionModel');

async function toggleLike(req, res, next) {
  try {
    const liked = await interactionModel.toggleLike(
      req.session.user.user_id,
      Number(req.params.postId)
    );

    res.json({ liked });
  } catch (error) {
    next(error);
  }
}

async function toggleBookmark(req, res, next) {
  try {
    const bookmarked = await interactionModel.toggleBookmark(
      req.session.user.user_id,
      Number(req.params.postId)
    );

    res.json({ bookmarked });
  } catch (error) {
    next(error);
  }
}

async function getMyBookmarks(req, res, next) {
  try {
    const bookmarks = await interactionModel.getBookmarksForUser(req.session.user.user_id);
    res.json({ bookmarks });
  } catch (error) {
    next(error);
  }
}

async function shareWorkout(req, res, next) {
  try {
    await interactionModel.recordShare({
      userId: req.session.user ? req.session.user.user_id : null,
      postId: Number(req.params.postId),
      platform: req.body.platform || 'copy_link',
    });

    res.json({ message: 'Share recorded.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  toggleLike,
  toggleBookmark,
  getMyBookmarks,
  shareWorkout,
};
