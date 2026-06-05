const prisma = require('../src/config/prisma');

const DEFAULT_STAGES = [
  { name: 'Applied', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', isSystem: true, systemType: 'APPLIED', isInterview: false },
  { name: 'Under Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', isSystem: false, systemType: null, isInterview: false },
  { name: 'Shortlisted', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', isSystem: false, systemType: null, isInterview: false },
  { name: 'HR Interview', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', isSystem: false, systemType: null, isInterview: true, instructions: 'Basic background check and culture fit.' },
  { name: 'Technical Interview', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', isSystem: false, systemType: null, isInterview: true, instructions: 'Assess technical skills and problem solving.' },
  { name: 'Selected', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', isSystem: true, systemType: 'SELECTED', isInterview: false },
  { name: 'Offer Sent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', isSystem: true, systemType: 'OFFER_SENT', isInterview: false },
  { name: 'Joined', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', isSystem: true, systemType: 'JOINED', isInterview: false },
  { name: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', isSystem: true, systemType: 'REJECTED', isInterview: false }
];

async function seed() {
  const companies = await prisma.company.findMany();
  for (const company of companies) {
    const existingStages = await prisma.workflowStage.count({ where: { companyId: company.id } });
    if (existingStages === 0) {
      console.log(`Seeding stages for company: ${company.name}`);
      for (let i = 0; i < DEFAULT_STAGES.length; i++) {
        await prisma.workflowStage.create({
          data: {
            ...DEFAULT_STAGES[i],
            order: i,
            companyId: company.id
          }
        });
      }
    }
  }

  // Migrate existing applications
  const applications = await prisma.application.findMany({ include: { job: true } });
  for (const app of applications) {
    if (!app.stageId) {
      let targetSystemType = null;
      let targetName = null;
      switch(app.status) {
        case 'APPLIED': targetSystemType = 'APPLIED'; break;
        case 'UNDER_REVIEW': targetName = 'Under Review'; break;
        case 'SHORTLISTED': targetName = 'Shortlisted'; break;
        case 'INTERVIEW_SCHEDULED': targetName = 'HR Interview'; break;
        case 'INTERVIEW_COMPLETED': targetName = 'Technical Interview'; break;
        case 'SELECTED': targetSystemType = 'SELECTED'; break;
        case 'OFFER_SENT': targetSystemType = 'OFFER_SENT'; break;
        case 'JOINED': targetSystemType = 'JOINED'; break;
        case 'REJECTED': targetSystemType = 'REJECTED'; break;
      }
      
      let stage = null;
      if (targetSystemType) {
        stage = await prisma.workflowStage.findFirst({ where: { companyId: app.job.companyId, systemType: targetSystemType } });
      } else if (targetName) {
        stage = await prisma.workflowStage.findFirst({ where: { companyId: app.job.companyId, name: targetName } });
      }

      if (stage) {
        await prisma.application.update({
          where: { id: app.id },
          data: { stageId: stage.id }
        });
      }
    }
  }

  console.log('Seeding complete.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
