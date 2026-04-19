import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const indicator = await db.indicator.findUnique({
      where: { id },
      include: {
        standard: true,
        evidences: true,
      },
    });

    if (!indicator) {
      return NextResponse.json({ error: 'Indicator not found' }, { status: 404 });
    }

    return NextResponse.json(indicator);
  } catch (error) {
    console.error('Error fetching indicator:', error);
    return NextResponse.json({ error: 'Failed to fetch indicator' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, order, requiredEvidence, standardId } = body;

    const indicator = await db.indicator.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(requiredEvidence !== undefined && { requiredEvidence }),
        ...(standardId !== undefined && { standardId }),
      },
    });

    return NextResponse.json(indicator);
  } catch (error) {
    console.error('Error updating indicator:', error);
    return NextResponse.json({ error: 'Failed to update indicator' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.indicator.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting indicator:', error);
    return NextResponse.json({ error: 'Failed to delete indicator' }, { status: 500 });
  }
}
