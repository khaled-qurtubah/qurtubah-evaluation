import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveProgressSnapshot } from '@/lib/snapshot';

// Helper to log activity
async function logActivity(action: string, entityType: string, entityId: string, entityName: string, details?: string, userName?: string) {
  try {
    await db.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        details: details || null,
        userName: userName || null,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Evidence API - supports status field (draft, submitted, approved)
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
    const { name, description, link, fileName, filePath, indicatorId, status, priority, comments, dueDate } = body;

    if (!name || !indicatorId) {
      return NextResponse.json({ error: 'Name and indicatorId are required' }, { status: 400 });
    }

    const evidence = await db.evidence.create({
      data: {
        name,
        description: description || null,
        link: link || null,
        fileName: fileName || null,
        filePath: filePath || null,
        status: status || 'draft',
        priority: priority || 'medium',
        comments: comments || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        indicatorId,
      },
    });

    // Log activity
    await logActivity('create', 'evidence', evidence.id, name, `تم إنشاء شاهد جديد بحالة: ${status || 'مسودة'}`);

    // Save progress snapshot after evidence creation
    await saveProgressSnapshot();

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error('Error creating evidence:', error);
    return NextResponse.json({ error: 'Failed to create evidence' }, { status: 500 });
  }
}
