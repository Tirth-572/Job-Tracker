const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = asyncHandler(async (req, res) => {
  const { email, password, role, firstName, lastName, companyName } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password and role are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  if (!['CANDIDATE', 'COMPANY'].includes(role)) {
    return res.status(400).json({ message: 'Role must be CANDIDATE or COMPANY' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      ...(role === 'CANDIDATE' && {
        candidate: { create: { firstName: firstName || '', lastName: lastName || '' } },
      }),
      ...(role === 'COMPANY' && {
        company: { create: { name: companyName || 'My Company' } },
      }),
    },
    include: { candidate: true, company: true },
  });

  const token = signToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ token, user: userWithoutPassword });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { candidate: true, company: true },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: 'Account blocked. Contact support.' });
  }

  const token = signToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      candidate: { include: { experiences: true, educations: true } },
      company: true,
    },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  // Bug #5 Fix: validate inputs before passing to bcrypt
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
  res.json({ message: 'Password updated successfully' });
});
