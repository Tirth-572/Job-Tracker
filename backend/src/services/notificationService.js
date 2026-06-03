const prisma = require('../config/prisma');
const { sendNotification } = require('./socketService');

const createNotification = async (userId, title, message, type, link, io) => {
  const notification = await prisma.notification.create({
    data: { userId, title, message, type, link },
  });
  if (io) sendNotification(io, userId, notification);
  return notification;
};

module.exports = { createNotification };
