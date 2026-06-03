const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const candidateRoutes = require('./candidates');
const companyRoutes = require('./companies');
const jobRoutes = require('./jobs');
const applicationRoutes = require('./applications');
const chatRoutes = require('./chat');
const notificationRoutes = require('./notifications');
const adminRoutes = require('./admin');

router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
