const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPasswordPlain) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be provided in .env');
    process.exit(1);
  }

  const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin seed data created successfully');
  console.log(`Admin: ${adminEmail} / [HIDDEN]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
