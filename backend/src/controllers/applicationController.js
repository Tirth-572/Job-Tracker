const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { addEmailJob } = require('../services/emailQueue');
const { createNotification } = require('../services/notificationService');

exports.apply = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const { jobId, coverLetter } = req.body;

  const existing = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
  });
  if (existing) return res.status(409).json({ message: 'Already applied to this job' });

  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const application = await prisma.application.create({
    data: {
      jobId,
      candidateId: candidate.id,
      coverLetter,
      resumeUrl: candidate.resumeUrl,
    },
    include: { job: { include: { company: true } }, candidate: true },
  });

  // Create chat room
  await prisma.chatRoom.create({
    data: {
      applicationId: application.id,
      candidateId: candidate.id,
      companyId: job.companyId,
    },
  });

  // Notify company
  await createNotification(
    job.company.userId,
    'New Application',
    `${candidate.firstName} ${candidate.lastName} applied for ${job.title}`,
    'APPLICATION',
    `/company/applications/${application.id}`,
    req.app.get('io')
  );

  // Email sending removed per user request

  res.status(201).json(application);
});

exports.getCandidateApplications = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const { status, page = 1, limit = 10 } = req.query;
  const safePage = parseInt(page) || 1;
  const safeLimit = parseInt(limit) || 10;
  const skip = (safePage - 1) * safeLimit;

  const where = { candidateId: candidate.id, ...(status && { status }) };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: { include: { company: { select: { name: true, logo: true, workflowStages: { orderBy: { order: 'asc' } } } } } },
        stage: true,
        interviews: { orderBy: { scheduledAt: 'asc' } },
        offerLetter: true,
      },
      orderBy: { appliedAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.application.count({ where }),
  ]);

  res.json({ applications, total, pages: Math.ceil(total / safeLimit) });
});

exports.getApplication = asyncHandler(async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: {
      job: { include: { company: true } },
      candidate: { include: { experiences: true, educations: true } },
      interviews: true,
      offerLetter: true,
    },
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });
  res.json(application);
});

exports.getCompanyApplications = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const { status, stageId, jobId, page = 1, limit = 20 } = req.query;
  const safePage = parseInt(page) || 1;
  const safeLimit = parseInt(limit) || 20;
  const skip = (safePage - 1) * safeLimit;

  const where = {
    job: { companyId: company.id },
    ...(status && { status }),
    ...(stageId && { stageId }),
    ...(jobId && { jobId }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: { select: { title: true } },
        candidate: true,
        stage: true,
        interviews: { orderBy: { scheduledAt: 'asc' }, take: 1 },
      },
      orderBy: { appliedAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.application.count({ where }),
  ]);

  res.json({ applications, total, pages: Math.ceil(total / safeLimit) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, stageId, notes, rejectionReason } = req.body;
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const application = await prisma.application.findFirst({
    where: { id: req.params.id, job: { companyId: company.id } },
    include: {
      job: { include: { company: true } },
      candidate: { include: { user: true } },
      stage: true
    },
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const statusChanged = (status && status !== application.status) || (stageId && stageId !== application.stageId);

  let newStage = application.stage;
  if (stageId) {
    newStage = await prisma.workflowStage.findUnique({ where: { id: stageId } });
  }

  const isRejected = status === 'REJECTED' || newStage?.systemType === 'REJECTED';

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: { 
      ...(status && { status }),
      ...(stageId && { stageId }),
      ...(notes !== undefined && { notes }),
      rejectionReason: isRejected ? rejectionReason : null
    },
    include: { stage: true }
  });

  if (statusChanged) {
    // Email sending removed per user request

    // Create notification for candidate
    await createNotification(
      application.candidate.userId,
      'Application Status Updated',
      `Your application for ${application.job.title} is now ${status.replace(/_/g, ' ')}`,
      'STATUS_UPDATE',
      `/candidate/applications/${application.id}`,
      req.app.get('io')
    );
  }

  res.json(updated);
});

exports.scheduleInterview = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, job: { companyId: company.id } },
    include: {
      job: { include: { company: true } },
      candidate: { include: { user: true } },
    },
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const interview = await prisma.interview.create({
    data: { ...req.body, applicationId: application.id },
  });

  if (req.body.stageId) {
    await prisma.application.update({
      where: { id: application.id },
      data: { stageId: req.body.stageId },
    });
  }

  // Email sending removed per user request

  await createNotification(
    application.candidate.userId,
    'Interview Scheduled',
    `Interview scheduled for ${application.job.title} at ${application.job.company.name}`,
    'INTERVIEW',
    `/candidate/applications/${application.id}`,
    req.app.get('io')
  );

  res.status(201).json(interview);
});

exports.uploadOfferLetter = asyncHandler(async (req, res) => {
  // Bug #4 Fix: guard against missing file
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, job: { companyId: company.id } },
    include: {
      job: { include: { company: true } },
      candidate: { include: { user: true } },
    },
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const offerLetter = await prisma.offerLetter.upsert({
    where: { applicationId: application.id },
    create: {
      applicationId: application.id,
      fileUrl: `/uploads/files/${req.file.filename}`,
      salary: req.body.salary ? parseInt(req.body.salary) : null,
      joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null,
    },
    update: {
      fileUrl: `/uploads/files/${req.file.filename}`,
      salary: req.body.salary ? parseInt(req.body.salary) : null,
      joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null,
    },
  });

  await prisma.application.update({
    where: { id: application.id },
    data: { status: 'OFFER_SENT' },
  });

  // Email sending removed per user request

  res.status(201).json(offerLetter);
});
