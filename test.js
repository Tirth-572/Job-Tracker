const prisma = require('./backend/src/config/prisma');

async function test() {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      console.log('No company found');
      return;
    }
    const res = await prisma.company.findUnique({
      where: { id: company.id },
      include: {
        user: { select: { email: true, phone: true } },
        jobs: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } },
        _count: { select: { jobs: true } },
      },
    });
    console.log(res);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
