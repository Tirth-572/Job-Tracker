const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123456', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@talentflow.com' },
    update: {},
    create: {
      email: 'admin@talentflow.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const companyPassword = await bcrypt.hash('company123456', 12);
  await prisma.user.upsert({
    where: { email: 'hr@techcorp.com' },
    update: {},
    create: {
      email: 'hr@techcorp.com',
      password: companyPassword,
      role: 'COMPANY',
      company: {
        create: {
          name: 'TechCorp Inc.',
          description: 'Leading technology company building innovative solutions.',
          industry: 'Technology',
          size: '201-500',
          website: 'https://techcorp.com',
          location: 'San Francisco, CA',
          isVerified: true,
        },
      },
    },
  });

  const candidatePassword = await bcrypt.hash('candidate123456', 12);
  await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: candidatePassword,
      role: 'CANDIDATE',
      candidate: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          location: 'New York, NY',
          bio: 'Full-stack developer with 5 years of experience.',
          skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
        },
      },
    },
  });

  console.log('✅ Seed data created successfully');
  console.log('Admin: admin@talentflow.com / admin123456');
  console.log('Company: hr@techcorp.com / company123456');
  console.log('Candidate: john@example.com / candidate123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
