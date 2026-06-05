const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getWorkflows = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
  if (!company) return res.status(404).json({ message: 'Company not found' });

  const stages = await prisma.workflowStage.findMany({
    where: { companyId: company.id },
    orderBy: { order: 'asc' }
  });

  res.json(stages);
});

exports.createStage = asyncHandler(async (req, res) => {
  const { name, color, isInterview, interviewType, instructions } = req.body;
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const count = await prisma.workflowStage.count({ where: { companyId: company.id } });

  const stage = await prisma.workflowStage.create({
    data: {
      companyId: company.id,
      name,
      color: color || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      order: count,
      isInterview: !!isInterview,
      interviewType: interviewType || null,
      instructions
    }
  });

  res.status(201).json(stage);
});

exports.updateStage = asyncHandler(async (req, res) => {
  const { name, color, isInterview, interviewType, instructions } = req.body;
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const stage = await prisma.workflowStage.findFirst({
    where: { id: req.params.id, companyId: company.id }
  });

  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  if (stage.isSystem) return res.status(400).json({ message: 'Cannot modify system stages' });

  const updated = await prisma.workflowStage.update({
    where: { id: stage.id },
    data: {
      name: name !== undefined ? name : stage.name,
      color: color !== undefined ? color : stage.color,
      isInterview: isInterview !== undefined ? isInterview : stage.isInterview,
      interviewType: interviewType !== undefined ? interviewType : stage.interviewType,
      instructions: instructions !== undefined ? instructions : stage.instructions
    }
  });

  res.json(updated);
});

exports.reorderStages = asyncHandler(async (req, res) => {
  const { stageIds } = req.body; // Array of IDs in the new order
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  // Use a transaction to update all orders
  const updates = stageIds.map((id, index) => 
    prisma.workflowStage.updateMany({
      where: { id, companyId: company.id },
      data: { order: index }
    })
  );

  await prisma.$transaction(updates);

  res.json({ message: 'Order updated' });
});

exports.deleteStage = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

  const stage = await prisma.workflowStage.findFirst({
    where: { id: req.params.id, companyId: company.id }
  });

  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  if (stage.isSystem) return res.status(400).json({ message: 'Cannot delete system stages' });

  // Move existing applications in this stage back to 'Applied' or the first stage
  const firstStage = await prisma.workflowStage.findFirst({
    where: { companyId: company.id },
    orderBy: { order: 'asc' }
  });

  if (firstStage) {
    await prisma.application.updateMany({
      where: { stageId: stage.id },
      data: { stageId: firstStage.id }
    });
  }

  await prisma.workflowStage.delete({ where: { id: stage.id } });

  res.json({ message: 'Stage deleted' });
});
