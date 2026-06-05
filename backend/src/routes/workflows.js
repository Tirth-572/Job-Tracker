const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workflowController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('COMPANY'));

router.get('/', ctrl.getWorkflows);
router.post('/', ctrl.createStage);
router.put('/reorder', ctrl.reorderStages);
router.put('/:id', ctrl.updateStage);
router.delete('/:id', ctrl.deleteStage);

module.exports = router;
