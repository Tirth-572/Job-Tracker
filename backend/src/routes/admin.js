const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getUsers);
router.patch('/users/:id/block', ctrl.blockUser);
router.get('/companies', ctrl.getCompanies);
router.patch('/companies/:id/verify', ctrl.verifyCompany);
router.patch('/companies/:id/block', ctrl.blockCompany);
router.get('/jobs', ctrl.getAllJobs);
router.delete('/jobs/:id', ctrl.deleteJob);
router.get('/email-logs', ctrl.getEmailLogs);
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);

module.exports = router;
