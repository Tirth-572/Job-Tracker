const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// No validation middleware on login/register - controller handles errors directly
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/password', authenticate, changePassword);

module.exports = router;
