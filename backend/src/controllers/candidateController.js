const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const parseDate = (d) => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
};

exports.getProfile = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({
    where: { userId: req.user.id },
    include: { experiences: true, educations: true },
  });
  res.json(candidate);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, dob, gender, location, bio, industry, jobTitle, skills, linkedinUrl, githubUrl, portfolioUrl } = req.body;
  const candidate = await prisma.candidate.update({
    where: { userId: req.user.id },
    data: { 
      firstName, lastName, phone, 
      dob: dob ? parseDate(dob) : null,
      gender, location, bio, industry, jobTitle, skills, linkedinUrl, githubUrl, portfolioUrl 
    },
  });
  res.json(candidate);
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const candidate = await prisma.candidate.update({
    where: { userId: req.user.id },
    data: { avatar: avatarUrl },
  });
  res.json({ avatar: candidate.avatar });
});

exports.removeAvatar = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.update({
    where: { userId: req.user.id },
    data: { avatar: null },
  });
  res.json({ message: 'Avatar removed successfully' });
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  const candidate = await prisma.candidate.update({
    where: { userId: req.user.id },
    data: { resumeUrl, resumeName: req.file.originalname },
  });
  res.json({ resumeUrl: candidate.resumeUrl, resumeName: candidate.resumeName });
});

exports.removeResume = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.update({
    where: { userId: req.user.id },
    data: { resumeUrl: null, resumeName: null },
  });
  res.json({ message: 'Resume removed successfully' });
});

exports.addExperience = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const { title, company, location, startDate, endDate, current, description } = req.body;

  if (!title || !company || !startDate) {
    return res.status(400).json({ message: 'Title, company and start date are required' });
  }

  const sDate = parseDate(startDate);
  if (!sDate) return res.status(400).json({ message: 'Invalid start date' });

  const exp = await prisma.experience.create({
    data: {
      title,
      company,
      location: location || null,
      startDate: sDate,
      endDate: endDate ? parseDate(endDate) : null,
      current: current === true || current === 'true',
      description: description || null,
      candidateId: candidate.id,
    },
  });
  res.status(201).json(exp);
});

exports.updateExperience = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const existing = await prisma.experience.findFirst({
    where: { id: req.params.id, candidateId: candidate.id },
  });
  if (!existing) return res.status(404).json({ message: 'Experience not found' });

  const { title, company, location, startDate, endDate, current, description } = req.body;
  const exp = await prisma.experience.update({
    where: { id: req.params.id },
    data: {
      title,
      company,
      location: location || null,
      startDate: startDate ? (parseDate(startDate) || existing.startDate) : existing.startDate,
      endDate: endDate ? parseDate(endDate) : null,
      current: current === true || current === 'true',
      description: description || null,
    },
  });
  res.json(exp);
});

exports.deleteExperience = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const existing = await prisma.experience.findFirst({
    where: { id: req.params.id, candidateId: candidate.id },
  });
  if (!existing) return res.status(404).json({ message: 'Experience not found' });

  await prisma.experience.delete({ where: { id: req.params.id } });
  res.json({ message: 'Experience deleted' });
});

exports.addEducation = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const { school, degree, field, startDate, endDate, current } = req.body;

  if (!school || !degree || !field || !startDate) {
    return res.status(400).json({ message: 'School, degree, field and start date are required' });
  }

  const sDate = parseDate(startDate);
  if (!sDate) return res.status(400).json({ message: 'Invalid start date' });

  const edu = await prisma.education.create({
    data: {
      school,
      degree,
      field,
      startDate: sDate,
      endDate: endDate ? parseDate(endDate) : null,
      current: current === true || current === 'true',
      candidateId: candidate.id,
    },
  });
  res.status(201).json(edu);
});

exports.updateEducation = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const existing = await prisma.education.findFirst({
    where: { id: req.params.id, candidateId: candidate.id },
  });
  if (!existing) return res.status(404).json({ message: 'Education not found' });

  const { school, degree, field, startDate, endDate, current } = req.body;
  const edu = await prisma.education.update({
    where: { id: req.params.id },
    data: {
      school,
      degree,
      field,
      startDate: startDate ? (parseDate(startDate) || existing.startDate) : existing.startDate,
      endDate: endDate ? parseDate(endDate) : null,
      current: current === true || current === 'true',
    },
  });
  res.json(edu);
});

exports.deleteEducation = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const existing = await prisma.education.findFirst({
    where: { id: req.params.id, candidateId: candidate.id },
  });
  if (!existing) return res.status(404).json({ message: 'Education not found' });

  await prisma.education.delete({ where: { id: req.params.id } });
  res.json({ message: 'Education deleted' });
});

exports.getSavedJobs = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const saved = await prisma.savedJob.findMany({
    where: { candidateId: candidate.id },
    include: { job: { include: { company: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(saved);
});

exports.saveJob = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  const saved = await prisma.savedJob.create({
    data: { jobId: req.params.jobId, candidateId: candidate.id },
  });
  res.status(201).json(saved);
});

exports.unsaveJob = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: req.user.id } });
  await prisma.savedJob.deleteMany({
    where: { jobId: req.params.jobId, candidateId: candidate.id },
  });
  res.json({ message: 'Job removed from saved' });
});
