/**
 * Seed historical progress snapshots for the Progress Timeline feature.
 * Generates 12 weekly snapshots going back 3 months,
 * each showing gradually increasing progress from ~10% to current ~35%.
 * 
 * Usage: cd /home/z/my-project && bun run scripts/seed-snapshots.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding progress snapshots...');

  // Get the current field IDs
  const fields = await prisma.field.findMany({
    orderBy: { order: 'asc' },
    include: {
      standards: {
        include: {
          indicators: {
            include: { evidences: true },
          },
        },
      },
    },
  });

  if (fields.length === 0) {
    console.error('❌ No fields found. Run the main seed script first.');
    process.exit(1);
  }

  // Current progress values
  const allIndicators = fields.flatMap((f) =>
    f.standards.flatMap((s) => s.indicators)
  );
  const currentTotalRequired = allIndicators.reduce(
    (sum, ind) => sum + ind.requiredEvidence,
    0
  );
  const currentTotalUploaded = allIndicators.reduce(
    (sum, ind) => sum + ind.evidences.length,
    0
  );
  const currentCompletedIndicators = allIndicators.filter(
    (ind) => ind.evidences.length >= ind.requiredEvidence
  ).length;
  const currentOverallProgress =
    currentTotalRequired > 0
      ? Math.round((currentTotalUploaded / currentTotalRequired) * 100)
      : 0;

  // Current per-domain progress
  const currentDomainProgress = fields.map((f) => {
    const fIndicators = f.standards.flatMap((s) => s.indicators);
    const fRequired = fIndicators.reduce(
      (sum, ind) => sum + ind.requiredEvidence,
      0
    );
    const fUploaded = fIndicators.reduce(
      (sum, ind) => sum + ind.evidences.length,
      0
    );
    const fCompleted = fIndicators.filter(
      (ind) => ind.evidences.length >= ind.requiredEvidence
    ).length;
    const fProgress =
      fRequired > 0 ? Math.round((fUploaded / fRequired) * 100) : 0;
    return { id: f.id, progress: fProgress, totalUploaded: fUploaded, totalRequired: fRequired, completedIndicators: fCompleted };
  });

  // Clear existing snapshots
  await prisma.progressSnapshot.deleteMany();
  console.log('  Cleared existing snapshots.');

  // Generate 12 weekly snapshots going back 3 months
  const now = new Date();
  const totalSnapshots = 12;

  for (let i = totalSnapshots - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7); // Go back i weeks

    // Progress interpolation: from ~10% to current progress
    const factor = (totalSnapshots - 1 - i) / (totalSnapshots - 1); // 0 to 1
    const startProgress = 10;
    // Use a slightly non-linear curve for realism
    const curveFactor = Math.pow(factor, 1.2);
    const overallProgress = Math.round(
      startProgress + (currentOverallProgress - startProgress) * curveFactor
    );

    // Calculate totals proportionally
    const uploadedRatio = overallProgress / 100;
    const totalUploaded = Math.round(currentTotalRequired * uploadedRatio);
    const completedIndicators = Math.round(
      (currentCompletedIndicators * curveFactor)
    );

    // Overall snapshot
    await prisma.progressSnapshot.create({
      data: {
        date,
        fieldId: null,
        progress: overallProgress,
        totalUploaded,
        totalRequired: currentTotalRequired,
        completedIndicators,
      },
    });

    // Per-domain snapshots
    for (let d = 0; d < fields.length; d++) {
      const domain = currentDomainProgress[d];
      const domainStartProgress = 5 + d * 3; // Different start points
      const domainProgress = Math.round(
        domainStartProgress + (domain.progress - domainStartProgress) * curveFactor
      );
      const domainUploaded = Math.round(domain.totalRequired * (domainProgress / 100));
      const domainCompleted = Math.round(domain.completedIndicators * curveFactor);

      await prisma.progressSnapshot.create({
        data: {
          date,
          fieldId: domain.id,
          progress: domainProgress,
          totalUploaded: domainUploaded,
          totalRequired: domain.totalRequired,
          completedIndicators: domainCompleted,
        },
      });
    }

    console.log(
      `  Week ${totalSnapshots - i}: ${date.toLocaleDateString('ar-SA')} → ${overallProgress}%`
    );
  }

  const totalCreated = totalSnapshots * (1 + fields.length);
  console.log(`\n✅ Created ${totalCreated} snapshots (${totalSnapshots} weeks × ${1 + fields.length} series)`);
  console.log(`   Overall: 10% → ${currentOverallProgress}%`);
  for (let d = 0; d < fields.length; d++) {
    console.log(`   ${fields[d].name}: ${5 + d * 3}% → ${currentDomainProgress[d].progress}%`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error seeding snapshots:', e);
  prisma.$disconnect();
  process.exit(1);
});
