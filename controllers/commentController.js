const commentModel = require('../models/commentModel');
const { canEditResource } = require('../middleware/authMiddleware');

async function createComment(req, res, next) {
  const postId = Number(req.params.postId);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }

  try {
    const commentId = await commentModel.createComment({
      userId: req.session.user.user_id,
      postId,
      content,
    });

    res.status(201).json({ message: 'Comment added.', comment_id: commentId });
  } catch (error) {
    next(error);
  }
}

async function updateComment(req, res, next) {
  const commentId = Number(req.params.commentId);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }

  try {
    const comment = await commentModel.getCommentOwner(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (!canEditResource(req, comment.user_id)) return res.status(403).json({ error: 'Not allowed.' });

    await commentModel.updateComment(commentId, content);
    res.json({ message: 'Comment updated.' });
  } catch (error) {
    next(error);
  }
}

async function deleteComment(req, res, next) {
  const commentId = Number(req.params.commentId);

  try {
    const comment = await commentModel.getCommentOwner(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (!canEditResource(req, comment.user_id)) return res.status(403).json({ error: 'Not allowed.' });

    await commentModel.softDeleteComment(commentId);
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment,
  updateComment,
  deleteComment,
};
