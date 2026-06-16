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
const supportRoutes = require('./support');
const stickyNotesRoutes = require('./stickyNotes');
const paymentRoutes = require('./payment');

router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);
router.use('/sticky-notes', stickyNotesRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;
