const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  res.json(tickets);
});

exports.createTicket = asyncHandler(async (req, res) => {
  const { subject, message, attachment } = req.body;
  
  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.id,
      subject,
      messages: {
        create: {
          senderId: req.user.id,
          message,
          attachment: attachment || null
        }
      }
    },
    include: {
      messages: true
    }
  });

  // Notify admins via socket
  const io = req.app.get('io');
  if (io) {
    io.emit('newSupportTicket', ticket);
  }

  res.status(201).json(ticket);
});

exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: req.params.id },
    include: {
      messages: {
        include: { sender: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      },
      user: { select: { id: true, email: true, role: true } }
    }
  });

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role !== 'ADMIN' && ticket.userId !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(ticket);
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { message, attachment } = req.body;
  
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role !== 'ADMIN' && ticket.userId !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const newMessage = await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: req.user.id,
      message,
      attachment: attachment || (req.file ? `/uploads/files/${req.file.filename}` : null)
    },
    include: { sender: { select: { id: true, email: true, role: true } } }
  });

  // Automatically update ticket status and updatedAt
  let newStatus = ticket.status;
  if (req.user.role === 'ADMIN') {
    newStatus = 'PENDING'; // Admin replied, waiting for user
  } else {
    newStatus = 'OPEN'; // User replied, waiting for admin
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: newStatus }
  });

  // Emit via Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(`support_${ticket.id}`).emit('supportMessage', newMessage);
  }

  res.status(201).json(newMessage);
});

exports.getAllTickets = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  
  const where = {};
  if (status) where.status = status;
  if (role) where.user = { role };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, role: true, candidate: true, company: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  
  res.json(tickets);
});

exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status }
  });
  
  const io = req.app.get('io');
  if (io) {
    io.to(`support_${ticket.id}`).emit('ticketUpdated', ticket);
  }
  
  res.json(ticket);
});
