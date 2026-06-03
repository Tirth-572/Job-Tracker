const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const onlineUsers = new Map();

const initSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return next(new Error('User not found'));
      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    onlineUsers.set(socket.userId, socket.id);
    io.emit('userOnline', socket.userId);

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('typing', { userId: socket.userId, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('userOffline', socket.userId);
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

const getSocketId = (userId) => onlineUsers.get(userId);

const sendNotification = (io, userId, notification) => {
  const socketId = getSocketId(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
};

module.exports = { initSocket, sendNotification, getSocketId };
