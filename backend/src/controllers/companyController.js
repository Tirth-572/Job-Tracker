const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { userId: req.user.id },
    include: { _count: { select: { jobs: true } } },
  });
  res.json(company);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, description, industry, size, website, location } = req.body;
  const company = await prisma.company.update({
    where: { userId: req.user.id },
    data: { name, description, industry, size, website, location },
  });
  res.json(company);
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  const company = await prisma.company.update({
    where: { userId: req.user.id },
    data: { logo: req.file.path },
  });
  res.json({ logo: company.logo });
});

exports.getPublicProfile = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: {
      jobs: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } },
      _count: { select: { jobs: true } },
    },
  });
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const [totalJobs, activeJobs, totalApplications, applicationsByStatus] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id } }),
    prisma.job.count({ where: { companyId: company.id, status: 'ACTIVE' } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
    prisma.application.groupBy({
      by: ['status'],
      where: { job: { companyId: company.id } },
      _count: true,
    }),
  ]);

  res.json({ totalJobs, activeJobs, totalApplications, applicationsByStatus });
});
