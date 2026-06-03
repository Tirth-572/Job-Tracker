const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { uploadFile } = require('../config/cloudinary');

router.use(authenticate);

router.get('/rooms', ctrl.getRooms);
router.get('/rooms/:roomId/messages', ctrl.getMessages);
router.post('/rooms/:roomId/messages', uploadFile.single('file'), ctrl.sendMessage);

module.exports = router;
