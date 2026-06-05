const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const { jobRules, validate } = require('../middleware/validate');

router.get('/', ctrl.getJobs);
router.get('/:id', ctrl.getJob);

router.use(authenticate, authorize('COMPANY'));
router.get('/company/mine', ctrl.getCompanyJobs);
router.post('/', jobRules, validate, ctrl.createJob);
router.put('/:id', ctrl.updateJob);
router.put('/:id/close', ctrl.closeJob);
router.post('/:id/repost', ctrl.repostJob);
router.delete('/:id', ctrl.deleteJob);

module.exports = router;
