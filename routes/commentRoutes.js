const express = require('express');
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/workouts/:postId/comments', requireAuth, commentController.createComment);
router.put('/comments/:commentId', requireAuth, commentController.updateComment);
router.delete('/comments/:commentId', requireAuth, commentController.deleteComment);

module.exports = router;
