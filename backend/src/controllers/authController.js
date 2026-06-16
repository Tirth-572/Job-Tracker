const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');
const { OAuth2Client } = require('google-auth-library');
const { sendEmail } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.sendOtp = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const isEmail = identifier.includes('@');
  if (!isEmail) {
    return res.status(400).json({ message: 'Please provide a valid email address for verification' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.otp.create({
    data: {
      email: identifier,
      code,
      expiresAt: new Date(Date.now() + 10 * 60000), // 10 mins
    },
  });

  try {
    await sendEmail({
      to: identifier,
      subject: 'Your Verification Code',
      template: 'otpVerification',
      data: { code },
    });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ message: 'Failed to send OTP email. Please check your email configuration.' });
  }

  res.json({ message: 'OTP sent successfully' });
});

exports.register = asyncHandler(async (req, res) => {
  const { email, phone, password, otp, role, firstName, lastName, companyName, companyLocation, companyType, companyWebsite, companyLinkedin } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required' });
  }

  if (password && password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  if (!['CANDIDATE', 'COMPANY'].includes(role)) {
    return res.status(400).json({ message: 'Role must be CANDIDATE or COMPANY' });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase().trim() },
        ...(phone ? [{ phone: phone.trim() }] : [])
      ]
    }
  });
  if (existing) return res.status(409).json({ message: 'Email or phone already registered' });

  // Verify OTP
  if (!otp) {
    return res.status(400).json({ message: 'OTP is required for registration' });
  }
  
  // Find valid OTP record
  const identifier = phone ? phone.trim() : email.toLowerCase().trim();
  const validOtp = await prisma.otp.findFirst({
    where: {
      code: otp,
      expiresAt: { gt: new Date() },
      OR: [
        { email: email.toLowerCase().trim() },
        ...(phone ? [{ phone: phone.trim() }] : [])
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!validOtp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Delete the OTP once verified
  await prisma.otp.delete({ where: { id: validOtp.id } });

  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      role,
      ...(role === 'CANDIDATE' && {
        candidate: { create: { firstName: firstName || '', lastName: lastName || '' } },
      }),
      ...(role === 'COMPANY' && {
        company: { create: { 
          name: companyName || 'My Company',
          location: companyLocation || null,
          industry: companyType || null,
          website: companyWebsite || null,
          linkedin: companyLinkedin || null
        } },
      }),
    },
    include: { candidate: true, company: true },
  });

  const token = signToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ token, user: userWithoutPassword });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, otp } = req.body; // email field here is used as the identifier for both email/phone

  if (!email) {
    return res.status(400).json({ message: 'Email/Phone is required' });
  }

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required to login' });
  }

  const identifier = email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier }
      ]
    },
    include: { candidate: true, company: true }
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Account is deactivated' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: 'Account is blocked by admin' });
  }

  // Verify OTP
  const validOtp = await prisma.otp.findFirst({
    where: {
      code: otp,
      expiresAt: { gt: new Date() },
      OR: [
        { email: identifier },
        { phone: identifier }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!validOtp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Clear verified OTP
  await prisma.otp.delete({ where: { id: validOtp.id } });

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
      admin: true,
    },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(400).json({ message: 'Current password incorrect' });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
  
  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'PASSWORD_CHANGED', ipAddress: req.ip }
  });

  res.json({ message: 'Password updated successfully' });
});

exports.updateEmail = asyncHandler(async (req, res) => {
  const { email, currentPassword } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (user.password) {
    if (!currentPassword) return res.status(400).json({ message: 'Current password is required to change email' });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }
  }

  const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim(), id: { not: user.id } } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { email: email.toLowerCase().trim() }
  });

  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'EMAIL_CHANGED', details: `Changed to ${email}`, ipAddress: req.ip }
  });

  res.json({ message: 'Email updated successfully (Verification Simulated)' });
});

exports.updatePhone = asyncHandler(async (req, res) => {
  const { phone, currentPassword } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone is required' });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (user.password) {
    if (!currentPassword) return res.status(400).json({ message: 'Current password is required to change phone number' });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }
  }

  const existing = await prisma.user.findFirst({ where: { phone: phone.trim(), id: { not: user.id } } });
  if (existing) return res.status(409).json({ message: 'Phone number already in use' });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { phone: phone.trim() }
  });

  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'PHONE_CHANGED', details: `Changed to ${phone}`, ipAddress: req.ip }
  });

  res.json({ message: 'Phone number updated successfully' });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const { emailNotifications, pushNotifications, profileVisibility } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(profileVisibility !== undefined && { profileVisibility }),
    }
  });

  res.json({ message: 'Settings updated successfully', user });
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential, role, customData } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, given_name, family_name, picture } = payload;

  let user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: { candidate: true, company: true },
  });

  if (!user) {
    if (!role) {
      return res.status(200).json({ requiresRoleSelection: true, googleData: { email, given_name, family_name, picture, googleId } });
    }

    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        role,
        ...(role === 'CANDIDATE' && {
          candidate: { create: { firstName: given_name || '', lastName: family_name || '', avatar: picture } },
        }),
        ...(role === 'COMPANY' && {
          company: { create: { 
            name: customData?.companyName || `${given_name}'s Company`,
            logo: picture,
            location: customData?.companyLocation || null,
            industry: customData?.companyType || null,
            website: customData?.companyWebsite || null,
            linkedin: customData?.companyLinkedin || null
          } },
        }),
      },
      include: { candidate: true, company: true },
    });
  } else {
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: user.avatar || picture },
        include: { candidate: true, company: true },
      });
    }
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: 'Account blocked. Contact support.' });
  }

  const token = signToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

exports.dummyLogin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), isActive: true, isBlocked: false },
    include: { candidate: true, company: true, admin: true }
  });

  if (!user) {
    return res.status(404).json({ message: `No dummy account found for ${email}.` });
  }

  const token = signToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

