const prisma = require('../config/prisma');

let emailQueue = null;

const initEmailQueue = () => {
  try {
    const Bull = require('bull');
    const { sendEmail } = require('./emailService');

    emailQueue = new Bull('email-queue', {
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
      settings: { stalledInterval: 0 },
    });

    emailQueue.process(async (job) => {
      const { logId, to, subject, template, data } = job.data;
      try {
        await prisma.emailLog.update({
          where: { id: logId },
          data: { status: 'PROCESSING', attempts: { increment: 1 } },
        });
        await sendEmail({ to, subject, template, data });
        await prisma.emailLog.update({
          where: { id: logId },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (err) {
        await prisma.emailLog.update({
          where: { id: logId },
          data: { status: 'FAILED', error: err.message },
        }).catch(() => {});
        throw err;
      }
    });

    emailQueue.on('failed', (job, err) => {
      console.error('Email job failed:', err.message);
    });

    console.log('Email queue initialized');
  } catch (err) {
    console.warn('Email queue unavailable (Redis offline?):', err.message);
    emailQueue = null;
  }
};

const addEmailJob = async (jobData) => {
  // Always create the log entry
  let log;
  try {
    log = await prisma.emailLog.create({
      data: {
        to: jobData.to,
        userId: jobData.userId || null,
        subject: jobData.subject,
        template: jobData.template,
        status: 'PENDING',
      },
    });
  } catch (err) {
    console.error('Failed to create email log:', err.message);
    return;
  }

  if (emailQueue) {
    try {
      await emailQueue.add(
        { ...jobData, logId: log.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true }
      );
    } catch (err) {
      console.warn('Failed to queue email (sending directly):', err.message);
      // Fallback: try sending directly without queue (fire and forget)
      Promise.resolve().then(async () => {
        try {
          const { sendEmail } = require('./emailService');
          await sendEmail({ to: jobData.to, subject: jobData.subject, template: jobData.template, data: jobData.data });
          await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'SENT', sentAt: new Date() } });
        } catch (e) {
          await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'FAILED', error: e.message } }).catch(() => {});
        }
      });
    }
  } else {
    // No queue — send directly (fire and forget)
    Promise.resolve().then(async () => {
      try {
        const { sendEmail } = require('./emailService');
        await sendEmail({ to: jobData.to, subject: jobData.subject, template: jobData.template, data: jobData.data });
        await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'SENT', sentAt: new Date() } });
      } catch (e) {
        await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'FAILED', error: e.message } }).catch(() => {});
      }
    });
  }
};

module.exports = { initEmailQueue, addEmailJob };
