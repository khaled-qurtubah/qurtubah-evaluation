import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/snapshots - Return all snapshots, sorted by date ascending
// Optional filter: ?fieldId=x (or "overall" for overall progress)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    const where = fieldId
      ? fieldId === 'overall'
        ? { fieldId: null }
        : { fieldId }
      : {};

    const snapshots = await db.progressSnapshot.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

// POST /api/snapshots - Create a new snapshot manually only
export async function POST() {
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
      totalRequired > 0 ? Math.min(100, Math.round((totalUploaded / totalRequired) * 100)) : 0;

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
        fRequired > 0 ? Math.min(100, Math.round((fUploaded / fRequired) * 100)) : 0;

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

    // Return the latest snapshots
    const snapshots = await db.progressSnapshot.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    });

    return NextResponse.json(snapshots, { status: 201 });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}

// DELETE /api/snapshots - Delete ALL snapshots (full reset)
export async function DELETE() {
  try {
    const result = await db.progressSnapshot.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `تم حذف جميع اللقطات (${result.count} لقطة)`,
    });
  } catch (error) {
    console.error('Error deleting snapshots:', error);
    return NextResponse.json({ error: 'Failed to delete snapshots' }, { status: 500 });
  }
}
