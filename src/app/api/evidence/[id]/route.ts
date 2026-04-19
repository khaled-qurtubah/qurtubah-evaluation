import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evidence = await db.evidence.findUnique({
      where: { id },
      include: {
        indicator: true,
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    return NextResponse.json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, link, fileName, filePath, status } = body;

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(link !== undefined && { link }),
        ...(fileName !== undefined && { fileName }),
        ...(filePath !== undefined && { filePath }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(evidence);
  } catch (error) {
    console.error('Error updating evidence:', error);
    return NextResponse.json({ error: 'Failed to update evidence' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.evidence.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    return NextResponse.json({ error: 'Failed to delete evidence' }, { status: 500 });
  }
}
