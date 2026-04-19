import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indicatorId = searchParams.get('indicatorId');

    const where = indicatorId ? { indicatorId } : {};

    const evidence = await db.evidence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        indicator: {
          include: {
            standard: {
              include: {
                field: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, link, fileName, filePath, indicatorId } = body;

    if (!name || !indicatorId) {
      return NextResponse.json({ error: 'Name and indicatorId are required' }, { status: 400 });
    }

    const evidence = await db.evidence.create({
      data: {
        name,
        link: link || null,
        fileName: fileName || null,
        filePath: filePath || null,
        indicatorId,
      },
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error('Error creating evidence:', error);
    return NextResponse.json({ error: 'Failed to create evidence' }, { status: 500 });
  }
}
