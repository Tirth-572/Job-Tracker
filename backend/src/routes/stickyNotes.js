const express = require('express');
const router = express.Router();
const stickyNoteController = require('../controllers/stickyNoteController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', stickyNoteController.getNotes);
router.post('/', stickyNoteController.createNote);
router.put('/:id', stickyNoteController.updateNote);
router.delete('/:id', stickyNoteController.deleteNote);

module.exports = router;
