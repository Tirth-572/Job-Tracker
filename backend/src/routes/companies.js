const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.get('/me/profile', authenticate, authorize('COMPANY'), ctrl.getProfile);
router.put('/me/profile', authenticate, authorize('COMPANY'), ctrl.updateProfile);
router.post('/me/logo', authenticate, authorize('COMPANY'), uploadAvatar.single('logo'), ctrl.uploadLogo);
router.delete('/me/logo', authenticate, authorize('COMPANY'), ctrl.removeLogo);
router.get('/me/stats', authenticate, authorize('COMPANY'), ctrl.getDashboardStats);

router.get('/:id', ctrl.getPublicProfile);

module.exports = router;
