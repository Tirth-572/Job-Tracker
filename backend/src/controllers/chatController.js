const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getRooms = asyncHandler(async (req, res) => {
  let rooms;
  if (req.user.role === 'CANDIDATE') {
    const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
    rooms = await prisma.chatRoom.findMany({
      where: { candidateId: candidate.id },
      include: {
        company: { select: { name: true, logo: true } },
        application: { include: { job: { select: { title: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  } else {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    rooms = await prisma.chatRoom.findMany({
      where: { companyId: company.id },
      include: {
        candidate: { select: { firstName: true, lastName: true, avatar: true } },
        application: { include: { job: { select: { title: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }
  res.json(rooms);
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await prisma.message.findMany({
    where: { roomId: req.params.roomId },
    include: { sender: { select: { id: true, role: true, candidate: { select: { firstName: true, lastName: true, avatar: true } }, company: { select: { name: true, logo: true } } } } },
    orderBy: { createdAt: 'asc' },
    skip,
    take: parseInt(limit),
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: { roomId: req.params.roomId, receiverId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.json(messages);
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: req.params.roomId },
    include: { candidate: { include: { user: true } }, company: { include: { user: true } } },
  });
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const receiverId = req.user.id === room.candidate.userId
    ? room.company.userId
    : room.candidate.userId;

  const message = await prisma.message.create({
    data: {
      roomId: room.id,
      senderId: req.user.id,
      receiverId,
      content: req.body.content,
      fileUrl: req.file?.path,
      fileType: req.file?.mimetype,
    },
    include: { sender: { select: { id: true, role: true } } },
  });

  req.app.get('io').to(room.id).emit('message', message);

  res.status(201).json(message);
});
