import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    const standardId = searchParams.get('standardId');

    if (fieldId) {
      const field = await db.field.findUnique({
        where: { id: fieldId },
        include: {
          standards: {
            orderBy: { order: 'asc' },
            include: {
              indicators: {
                orderBy: { order: 'asc' },
                include: {
                  evidences: true,
                },
              },
            },
          },
        },
      });

      if (!field) {
        return NextResponse.json({ error: 'Field not found' }, { status: 404 });
      }

      const allIndicators = field.standards.flatMap((s) => s.indicators);
      const totalRequired = allIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
      const totalUploaded = allIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
      const completedIndicators = allIndicators.filter(
        (ind) => ind.evidences.length >= ind.requiredEvidence
      ).length;

      return NextResponse.json({
        fieldId: field.id,
        fieldName: field.name,
        totalIndicators: allIndicators.length,
        completedIndicators,
        totalRequired,
        totalUploaded,
        progress: totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0,
        standards: field.standards.map((s) => {
          const sIndicators = s.indicators;
          const sRequired = sIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
          const sUploaded = sIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
          return {
            id: s.id,
            name: s.name,
            totalIndicators: sIndicators.length,
            completedIndicators: sIndicators.filter((ind) => ind.evidences.length >= ind.requiredEvidence).length,
            totalRequired: sRequired,
            totalUploaded: sUploaded,
            progress: sRequired > 0 ? Math.round((sUploaded / sRequired) * 100) : 0,
          };
        }),
      });
    }

    if (standardId) {
      const standard = await db.standard.findUnique({
        where: { id: standardId },
        include: {
          indicators: {
            orderBy: { order: 'asc' },
            include: {
              evidences: true,
            },
          },
        },
      });

      if (!standard) {
        return NextResponse.json({ error: 'Standard not found' }, { status: 404 });
      }

      const totalRequired = standard.indicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
      const totalUploaded = standard.indicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
      const completedIndicators = standard.indicators.filter(
        (ind) => ind.evidences.length >= ind.requiredEvidence
      ).length;

      return NextResponse.json({
        standardId: standard.id,
        standardName: standard.name,
        totalIndicators: standard.indicators.length,
        completedIndicators,
        totalRequired,
        totalUploaded,
        progress: totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0,
      });
    }

    // Overall progress
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

    const allIndicators = fields.flatMap((f) =>
      f.standards.flatMap((s) => s.indicators)
    );
    const totalRequired = allIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
    const totalUploaded = allIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
    const completedIndicators = allIndicators.filter(
      (ind) => ind.evidences.length >= ind.requiredEvidence
    ).length;

    const fieldsProgress = fields.map((f) => {
      const fIndicators = f.standards.flatMap((s) => s.indicators);
      const fRequired = fIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
      const fUploaded = fIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
      return {
        id: f.id,
        name: f.name,
        icon: f.icon,
        totalIndicators: fIndicators.length,
        completedIndicators: fIndicators.filter((ind) => ind.evidences.length >= ind.requiredEvidence).length,
        totalRequired: fRequired,
        totalUploaded: fUploaded,
        progress: fRequired > 0 ? Math.round((fUploaded / fRequired) * 100) : 0,
      };
    });

    return NextResponse.json({
      totalFields: fields.length,
      totalIndicators: allIndicators.length,
      completedIndicators,
      totalRequired,
      totalUploaded,
      progress: totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0,
      fields: fieldsProgress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
