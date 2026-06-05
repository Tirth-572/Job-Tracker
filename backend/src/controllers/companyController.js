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
  const { name, description, industry, size, website, linkedin, location, hrName, hrDesignation, city, state, country, address, foundedYear } = req.body;
  const company = await prisma.company.update({
    where: { userId: req.user.id },
    data: { 
      name, description, industry, size, website, linkedin, location, 
      hrName, hrDesignation, city, state, country, address, 
      foundedYear: foundedYear ? parseInt(foundedYear) : null 
    },
  });
  res.json(company);
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const logoUrl = `/uploads/avatars/${req.file.filename}`;
  const company = await prisma.company.update({
    where: { userId: req.user.id },
    data: { logo: logoUrl },
  });
  res.json({ logo: company.logo });
});

exports.removeLogo = asyncHandler(async (req, res) => {
  const company = await prisma.company.update({
    where: { userId: req.user.id },
    data: { logo: null },
  });
  res.json({ message: 'Logo removed successfully' });
});

exports.getPublicProfile = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { email: true, phone: true } },
      jobs: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } },
      _count: { select: { jobs: true } },
    },
  });
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const [totalJobs, activeJobs, expiredJobs, closedJobs, totalApplications, applicationsByStatus] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id } }),
    prisma.job.count({ where: { companyId: company.id, status: 'ACTIVE' } }),
    prisma.job.count({ where: { companyId: company.id, status: 'EXPIRED' } }),
    prisma.job.count({ where: { companyId: company.id, status: 'CLOSED' } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
    prisma.application.groupBy({
      by: ['status'],
      where: { job: { companyId: company.id } },
      _count: true,
    }),
  ]);

  res.json({ totalJobs, activeJobs, expiredJobs, closedJobs, totalApplications, applicationsByStatus });
});
