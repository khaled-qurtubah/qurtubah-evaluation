import { PrismaClient } from '@prisma/client';

// Create a fresh PrismaClient to ensure the progressSnapshot model is available
const db = new PrismaClient();

/**
 * Save a progress snapshot for overall progress and each domain.
 * This is called after evidence create/update/delete operations.
 */
export async function saveProgressSnapshot(): Promise<void> {
  try {
    // Fetch all fields with full nested data
    const fields = await db.field.findMany({
      orderBy: { order: 'asc' },
      include: {
        standards: {
          include: {
            indicators: {
              include: {
                evidences: true,
              },
            },
          },
        },
      },
    });

    // Calculate overall progress
    const allIndicators = fields.flatMap((f) =>
      f.standards.flatMap((s) => s.indicators)
    );
    const totalRequired = allIndicators.reduce(
      (sum, ind) => sum + ind.requiredEvidence,
      0
    );
    const totalUploaded = allIndicators.reduce(
      (sum, ind) => sum + ind.evidences.length,
      0
    );
    const completedIndicators = allIndicators.filter(
      (ind) => ind.evidences.length >= ind.requiredEvidence
    ).length;
    const overallProgress =
      totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

    const now = new Date();

    // Save overall snapshot (fieldId = null)
    await db.progressSnapshot.create({
      data: {
        date: now,
        fieldId: null,
        progress: overallProgress,
        totalUploaded,
        totalRequired,
        completedIndicators,
      },
    });

    // Save per-domain snapshot
    for (const field of fields) {
      const fIndicators = field.standards.flatMap((s) => s.indicators);
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

      await db.progressSnapshot.create({
        data: {
          date: now,
          fieldId: field.id,
          progress: fProgress,
          totalUploaded: fUploaded,
          totalRequired: fRequired,
          completedIndicators: fCompleted,
        },
      });
    }
  } catch (error) {
    console.error('Error saving progress snapshot:', error);
  }
}
