import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    const where = fieldId ? { fieldId } : {};

    const standards = await db.standard.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        field: true,
        indicators: {
          orderBy: { order: 'asc' },
          include: {
            evidences: true,
          },
        },
      },
    });

    return NextResponse.json(standards);
  } catch (error) {
    console.error('Error fetching standards:', error);
    return NextResponse.json({ error: 'Failed to fetch standards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, order, fieldId } = body;

    if (!name || !fieldId) {
      return NextResponse.json({ error: 'Name and fieldId are required' }, { status: 400 });
    }

    const standard = await db.standard.create({
      data: {
        name,
        description: description || null,
        order: order || 0,
        fieldId,
      },
    });

    return NextResponse.json(standard, { status: 201 });
  } catch (error) {
    console.error('Error creating standard:', error);
    return NextResponse.json({ error: 'Failed to create standard' }, { status: 500 });
  }
}
