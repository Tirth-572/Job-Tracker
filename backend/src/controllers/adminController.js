const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getStats = asyncHandler(async (req, res) => {
  const [users, companies, jobs, applications] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
  ]);

  const recentApplications = await prisma.application.groupBy({
    by: ['status'],
    _count: true,
  });

  const jobsByType = await prisma.job.groupBy({
    by: ['type'],
    _count: true,
  });

  res.json({ users, companies, jobs, applications, recentApplications, jobsByType });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { candidate: { firstName: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(role && { role }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { candidate: { select: { firstName: true, lastName: true } }, company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);

  const sanitized = users.map(({ password, ...u }) => u);
  res.json({ users: sanitized, total, pages: Math.ceil(total / limit) });
});

exports.blockUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlocked: req.body.block },
  });
  res.json({ message: `User ${req.body.block ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
});

exports.getCompanies = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = search
    ? { name: { contains: search, mode: 'insensitive' } }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: { _count: { select: { jobs: true } }, user: { select: { email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.company.count({ where }),
  ]);

  res.json({ companies, total, pages: Math.ceil(total / limit) });
});

exports.verifyCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: { isVerified: req.body.verified },
  });
  res.json(company);
});

exports.blockCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: { isBlocked: req.body.block },
  });
  res.json(company);
});

exports.getAllJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = status ? { status } : {};

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { company: { select: { name: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ jobs, total, pages: Math.ceil(total / limit) });
});

exports.deleteJob = asyncHandler(async (req, res) => {
  await prisma.job.delete({ where: { id: req.params.id } });
  res.json({ message: 'Job deleted' });
});

exports.getEmailLogs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = status ? { status } : {};

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.emailLog.count({ where }),
  ]);

  res.json({ logs, total, pages: Math.ceil(total / limit) });
});

exports.getProfile = asyncHandler(async (req, res) => {
  let admin = await prisma.admin.findUnique({ where: { userId: req.user.id } });
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        userId: req.user.id,
        firstName: req.user.email.split('@')[0],
        lastName: 'Admin'
      }
    });
  }
  res.json(admin);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, designation } = req.body;
  const admin = await prisma.admin.update({
    where: { userId: req.user.id },
    data: { firstName, lastName, designation },
  });
  res.json(admin);
});
