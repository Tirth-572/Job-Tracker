const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/candidateController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAvatar, uploadResume } = require('../config/cloudinary');

router.use(authenticate, authorize('CANDIDATE'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), ctrl.uploadAvatar);
router.delete('/avatar', ctrl.removeAvatar);
router.post('/resume', uploadResume.single('resume'), ctrl.uploadResume);
router.delete('/resume', ctrl.removeResume);

router.post('/experiences', ctrl.addExperience);
router.put('/experiences/:id', ctrl.updateExperience);
router.delete('/experiences/:id', ctrl.deleteExperience);

router.post('/educations', ctrl.addEducation);
router.put('/educations/:id', ctrl.updateEducation);
router.delete('/educations/:id', ctrl.deleteEducation);

router.get('/saved-jobs', ctrl.getSavedJobs);
router.post('/saved-jobs/:jobId', ctrl.saveJob);
router.delete('/saved-jobs/:jobId', ctrl.unsaveJob);

module.exports = router;
