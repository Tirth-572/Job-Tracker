const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// No validation middleware on login/register - controller handles errors directly
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/send-otp', authController.sendOtp);
router.post('/dummy-login', authController.dummyLogin);


router.get('/me', authenticate, authController.getMe);
router.put('/password', authenticate, authController.changePassword);
router.put('/email', authenticate, authController.updateEmail);
router.put('/phone', authenticate, authController.updatePhone);
router.put('/settings', authenticate, authController.updateSettings);

module.exports = router;
