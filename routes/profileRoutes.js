const express = require('express');
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/:username', profileController.getProfile);
router.put('/me', requireAuth, upload.single('profile_picture'), profileController.updateMe);

module.exports = router;
