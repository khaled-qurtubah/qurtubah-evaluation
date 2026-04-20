import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const standard = await db.standard.findUnique({
      where: { id },
      include: {
        field: true,
        indicators: {
          orderBy: { order: 'asc' },
          include: { evidences: true },
        },
      },
    });

    if (!standard) {
      return NextResponse.json({ error: 'Standard not found' }, { status: 404 });
    }

    return NextResponse.json(standard);
  } catch (error) {
    console.error('Error fetching standard:', error);
    return NextResponse.json({ error: 'Failed to fetch standard' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, order, fieldId } = body;

    const standard = await db.standard.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(fieldId !== undefined && { fieldId }),
      },
    });

    return NextResponse.json(standard);
  } catch (error) {
    console.error('Error updating standard:', error);
    return NextResponse.json({ error: 'Failed to update standard' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.standard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting standard:', error);
    return NextResponse.json({ error: 'Failed to delete standard' }, { status: 500 });
  }
}
