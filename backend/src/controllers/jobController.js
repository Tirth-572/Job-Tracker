const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getJobs = asyncHandler(async (req, res) => {
  const { search, type, location, skills, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'ACTIVE',
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(type && { type }),
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(skills && { skills: { hasSome: skills.split(',') } }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { company: { select: { name: true, logo: true, location: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ jobs, total, pages: Math.ceil(total / limit), page: parseInt(page) });
});

exports.getJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { company: true, _count: { select: { applications: true } } },
  });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  await prisma.job.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
  res.json(job);
});

// Bug #3 Fix: extract only allowed fields — no req.body spread
const pickJobFields = (body) => ({
  title: body.title,
  description: body.description,
  requirements: body.requirements || null,
  benefits: body.benefits || null,
  location: body.location,
  type: body.type,
  status: body.status,
  salaryMin: body.salaryMin ? parseInt(body.salaryMin) : null,
  salaryMax: body.salaryMax ? parseInt(body.salaryMax) : null,
  currency: body.currency || 'USD',
  skills: Array.isArray(body.skills) ? body.skills : (body.skills ? body.skills.split(',').map(s => s.trim()).filter(Boolean) : []),
  experience: body.experience || null,
  deadline: body.deadline ? new Date(body.deadline) : null,
});

exports.createJob = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const data = pickJobFields(req.body);
  if (!data.title || !data.description || !data.location) {
    return res.status(400).json({ message: 'Title, description and location are required' });
  }
  const job = await prisma.job.create({
    data: { ...data, companyId: company.id },
  });
  res.status(201).json(job);
});

exports.updateJob = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const job = await prisma.job.findFirst({ where: { id: req.params.id, companyId: company.id } });
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // Only update provided fields — strip undefined
  const raw = pickJobFields(req.body);
  const data = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined));

  const updated = await prisma.job.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const job = await prisma.job.findFirst({ where: { id: req.params.id, companyId: company.id } });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  await prisma.job.delete({ where: { id: req.params.id } });
  res.json({ message: 'Job deleted' });
});

exports.getCompanyJobs = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { companyId: company.id, ...(status && { status }) };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ jobs, total, pages: Math.ceil(total / limit) });
});
