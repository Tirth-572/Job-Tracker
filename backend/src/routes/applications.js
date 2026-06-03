const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadFile } = require('../config/cloudinary');

router.use(authenticate);

router.post('/', authorize('CANDIDATE'), ctrl.apply);
router.get('/candidate', authorize('CANDIDATE'), ctrl.getCandidateApplications);
router.get('/company', authorize('COMPANY'), ctrl.getCompanyApplications);
router.get('/:id', ctrl.getApplication);
router.patch('/:id/status', authorize('COMPANY'), ctrl.updateStatus);
router.post('/:id/interviews', authorize('COMPANY'), ctrl.scheduleInterview);
router.post('/:id/offer', authorize('COMPANY'), uploadFile.single('offer'), ctrl.uploadOfferLetter);

module.exports = router;
