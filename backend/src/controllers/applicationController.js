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

  // Send confirmation email to candidate
  await addEmailJob({
    to: req.user.email,
    userId: req.user.id,
    subject: `Application Submitted - ${job.title}`,
    template: 'applicationConfirmation',
    data: {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      companyName: job.company.name,
      jobTitle: job.title,
      dashboardLink: `${process.env.CLIENT_URL}/candidate/applications`,
    },
  });

  res.status(201).json(application);
});

exports.getCandidateApplications = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { candidateId: candidate.id, ...(status && { status }) };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: { include: { company: { select: { name: true, logo: true } } } },
        interviews: { orderBy: { scheduledAt: 'asc' } },
        offerLetter: true,
      },
      orderBy: { appliedAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.application.count({ where }),
  ]);

  res.json({ applications, total, pages: Math.ceil(total / limit) });
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
  const { status, jobId, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    job: { companyId: company.id },
    ...(status && { status }),
    ...(jobId && { jobId }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: { select: { title: true } },
        candidate: true,
        interviews: { orderBy: { scheduledAt: 'asc' }, take: 1 },
      },
      orderBy: { appliedAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.application.count({ where }),
  ]);

  res.json({ applications, total, pages: Math.ceil(total / limit) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, notes, rejectionReason } = req.body;
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const application = await prisma.application.findFirst({
    where: { id: req.params.id, job: { companyId: company.id } },
    include: {
      job: { include: { company: true } },
      candidate: { include: { user: true } },
    },
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: { status, notes, ...(rejectionReason && { rejectionReason }) },
  });

  // Send status update email
  await addEmailJob({
    to: application.candidate.user.email,
    userId: application.candidate.userId,
    subject: `Application Update - ${application.job.title} at ${application.job.company.name}`,
    template: 'statusUpdate',
    data: {
      candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      companyName: application.job.company.name,
      jobTitle: application.job.title,
      status,
      rejectionReason,
      dashboardLink: `${process.env.CLIENT_URL}/candidate/applications`,
    },
  });

  // Create notification for candidate
  await createNotification(
    application.candidate.userId,
    'Application Status Updated',
    `Your application for ${application.job.title} is now ${status.replace(/_/g, ' ')}`,
    'STATUS_UPDATE',
    `/candidate/applications/${application.id}`,
    req.app.get('io')
  );

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

  await prisma.application.update({
    where: { id: application.id },
    data: { status: 'INTERVIEW_SCHEDULED' },
  });

  await addEmailJob({
    to: application.candidate.user.email,
    userId: application.candidate.userId,
    subject: `Interview Scheduled - ${application.job.title}`,
    template: 'interviewScheduled',
    data: {
      candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      companyName: application.job.company.name,
      jobTitle: application.job.title,
      scheduledAt: interview.scheduledAt,
      type: interview.type,
      meetingLink: interview.meetingLink,
      location: interview.location,
      dashboardLink: `${process.env.CLIENT_URL}/candidate/applications`,
    },
  });

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

  await addEmailJob({
    to: application.candidate.user.email,
    userId: application.candidate.userId,
    subject: `Offer Letter - ${application.job.title} at ${application.job.company.name}`,
    template: 'offerSent',
    data: {
      candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      companyName: application.job.company.name,
      jobTitle: application.job.title,
      dashboardLink: `${process.env.CLIENT_URL}/candidate/applications`,
    },
  });

  res.status(201).json(offerLetter);
});
