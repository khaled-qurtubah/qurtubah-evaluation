import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { saveProgressSnapshot } from '@/lib/snapshot';

// Create a fresh PrismaClient to ensure the progressSnapshot model is available
// This handles the case where the singleton db client was created before the schema migration
const prisma = new PrismaClient();

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

    const snapshots = await prisma.progressSnapshot.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

// POST /api/snapshots - Create a new snapshot from current progress data
export async function POST() {
  try {
    await saveProgressSnapshot();

    // Return the latest snapshots
    const snapshots = await prisma.progressSnapshot.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    });

    return NextResponse.json(snapshots, { status: 201 });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}
