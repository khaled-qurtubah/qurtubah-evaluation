import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/activity - Retrieve activity log entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType');

    const where = entityType ? { entityType } : {};

    const activities = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    const total = await db.activityLog.count({ where });

    return NextResponse.json({ activities, total });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}

// POST /api/activity - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entityType, entityId, entityName, details, userName } = body;

    if (!action || !entityType || !entityId || !entityName) {
      return NextResponse.json(
        { error: 'action, entityType, entityId, and entityName are required' },
        { status: 400 }
      );
    }

    const activity = await db.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        details: details || null,
        userName: userName || null,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}

// DELETE /api/activity - Clear all activity logs
export async function DELETE() {
  try {
    await db.activityLog.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing activity log:', error);
    return NextResponse.json({ error: 'Failed to clear activity log' }, { status: 500 });
  }
}
