const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123456', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@hirebridge.com' },
    update: {},
    create: {
      email: 'admin@hirebridge.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const companyPassword = await bcrypt.hash('company123456', 12);
  await prisma.user.upsert({
    where: { email: 'hr@techcorp.com' },
    update: {
      company: {
        update: {
          logo: 'https://ui-avatars.com/api/?name=TechCorp+Inc.&background=0D8ABC&color=fff&size=256'
        }
      }
    },
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
          logo: 'https://ui-avatars.com/api/?name=TechCorp+Inc.&background=0D8ABC&color=fff&size=256',
        },
      },
    },
  });

  const candidatePassword = await bcrypt.hash('candidate123456', 12);
  await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {
      candidate: {
        update: {
          avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random&color=fff&size=256'
        }
      }
    },
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
          avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random&color=fff&size=256',
        },
      },
    },
  });

  console.log('✅ Seed data created successfully');
  console.log('Admin: admin@hirebridge.com / admin123456');
  console.log('Company: hr@techcorp.com / company123456');
  console.log('Candidate: john@example.com / candidate123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
