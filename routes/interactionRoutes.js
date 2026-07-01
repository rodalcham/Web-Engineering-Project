const express = require('express');
const interactionController = require('../controllers/interactionController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/workouts/:postId/like', requireAuth, interactionController.toggleLike);
router.post('/workouts/:postId/bookmark', requireAuth, interactionController.toggleBookmark);
router.get('/bookmarks/me', requireAuth, interactionController.getMyBookmarks);
router.post('/workouts/:postId/share', interactionController.shareWorkout);

module.exports = router;
