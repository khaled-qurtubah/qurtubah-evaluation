import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const standardId = searchParams.get('standardId');

    const where = standardId ? { standardId } : {};

    const indicators = await db.indicator.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        standard: true,
        evidences: true,
      },
    });

    return NextResponse.json(indicators);
  } catch (error) {
    console.error('Error fetching indicators:', error);
    return NextResponse.json({ error: 'Failed to fetch indicators' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, order, requiredEvidence, standardId } = body;

    if (!name || !standardId) {
      return NextResponse.json({ error: 'Name and standardId are required' }, { status: 400 });
    }

    const indicator = await db.indicator.create({
      data: {
        name,
        description: description || null,
        order: order || 0,
        requiredEvidence: requiredEvidence || 1,
        standardId,
      },
    });

    return NextResponse.json(indicator, { status: 201 });
  } catch (error) {
    console.error('Error creating indicator:', error);
    return NextResponse.json({ error: 'Failed to create indicator' }, { status: 500 });
  }
}
