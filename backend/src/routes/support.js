const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadFile } = require('../config/cloudinary');
const supportController = require('../controllers/supportController');

// All users can access their own tickets
router.route('/my-tickets')
  .get(authenticate, supportController.getUserTickets)
  .post(authenticate, supportController.createTicket);

// Message sending
router.post('/:id/messages', authenticate, uploadFile.single('attachment'), supportController.sendMessage);

// Get specific ticket
router.get('/:id', authenticate, supportController.getTicket);

// Admin only routes
router.use(authenticate, authorize('ADMIN'));
router.get('/', supportController.getAllTickets);
router.patch('/:id/status', supportController.updateTicketStatus);

module.exports = router;
