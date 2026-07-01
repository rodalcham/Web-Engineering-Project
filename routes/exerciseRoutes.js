const express = require('express');
const exerciseController = require('../controllers/exerciseController');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', exerciseController.listExercises);
router.post('/', requireAuth, upload.single('image'), exerciseController.createExercise);

module.exports = router;
