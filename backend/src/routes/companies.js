const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.get('/:id', ctrl.getPublicProfile);
router.use(authenticate, authorize('COMPANY'));
router.get('/me/profile', ctrl.getProfile);
router.put('/me/profile', ctrl.updateProfile);
router.post('/me/logo', uploadAvatar.single('logo'), ctrl.uploadLogo);
router.get('/me/stats', ctrl.getDashboardStats);

module.exports = router;
