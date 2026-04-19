import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const fields = await db.field.findMany({
      orderBy: { order: 'asc' },
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

    const fieldsWithCounts = fields.map((field) => {
      const allIndicators = field.standards.flatMap((s) => s.indicators);
      const totalRequired = allIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
      const totalUploaded = allIndicators.reduce(
        (sum, ind) => sum + ind.evidences.length,
        0
      );
      const totalIndicators = allIndicators.length;
      const completedIndicators = allIndicators.filter(
        (ind) => ind.evidences.length >= ind.requiredEvidence
      ).length;

      return {
        id: field.id,
        name: field.name,
        description: field.description,
        order: field.order,
        icon: field.icon,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt,
        standardsCount: field.standards.length,
        indicatorsCount: totalIndicators,
        totalRequired,
        totalUploaded,
        completedIndicators,
        progress: totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0,
        standards: field.standards,
      };
    });

    return NextResponse.json(fieldsWithCounts);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, order, icon } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const field = await db.field.create({
      data: {
        name,
        description: description || null,
        order: order || 0,
        icon: icon || null,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error('Error creating field:', error);
    return NextResponse.json({ error: 'Failed to create field' }, { status: 500 });
  }
}
