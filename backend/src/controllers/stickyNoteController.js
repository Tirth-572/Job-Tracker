const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getNotes = asyncHandler(async (req, res) => {
  const notes = await prisma.stickyNote.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(notes);
});

exports.createNote = asyncHandler(async (req, res) => {
  const { content, color, positionX, positionY } = req.body;

  const note = await prisma.stickyNote.create({
    data: {
      userId: req.user.id,
      content: content || '',
      color: color || 'bg-yellow-200',
      positionX: positionX || 0,
      positionY: positionY || 0
    }
  });

  res.status(201).json(note);
});

exports.updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, color, positionX, positionY } = req.body;

  // Verify ownership
  const existing = await prisma.stickyNote.findFirst({
    where: { id, userId: req.user.id }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Sticky note not found' });
  }

  const updatedNote = await prisma.stickyNote.update({
    where: { id },
    data: {
      ...(content !== undefined && { content }),
      ...(color !== undefined && { color }),
      ...(positionX !== undefined && { positionX }),
      ...(positionY !== undefined && { positionY })
    }
  });

  res.json(updatedNote);
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const existing = await prisma.stickyNote.findFirst({
    where: { id, userId: req.user.id }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Sticky note not found' });
  }

  await prisma.stickyNote.delete({
    where: { id }
  });

  res.json({ message: 'Sticky note deleted successfully' });
});
