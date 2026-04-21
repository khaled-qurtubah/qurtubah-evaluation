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
    const { name, description, link, fileName, filePath, status, priority, comments, dueDate } = body;

    // Get the existing evidence name for activity log
    const existing = await db.evidence.findUnique({ where: { id } });
    const entityName = name || existing?.name || 'شاهد';

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(link !== undefined && { link }),
        ...(fileName !== undefined && { fileName }),
        ...(filePath !== undefined && { filePath }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(comments !== undefined && { comments }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    // Log activity - build details about what changed
    const changes: string[] = [];
    if (name !== undefined && name !== existing?.name) changes.push('الاسم');
    if (status !== undefined && status !== existing?.status) changes.push(`الحالة → ${status}`);
    if (priority !== undefined && priority !== existing?.priority) changes.push(`الأهمية → ${priority}`);
    if (comments !== undefined && comments !== existing?.comments) changes.push('التعليقات');
    if (link !== undefined) changes.push('الرابط');
    if (filePath !== undefined) changes.push('الملف');

    const details = changes.length > 0 ? `تم تحديث: ${changes.join('، ')}` : 'تم تحديث الشاهد';

    await logActivity('update', 'evidence', id, entityName, details);

    // Save progress snapshot after evidence update
    await saveProgressSnapshot();

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

    // Get the evidence name before deletion for activity log
    const evidence = await db.evidence.findUnique({ where: { id } });
    const entityName = evidence?.name || 'شاهد محذوف';

    await db.evidence.delete({ where: { id } });

    // Log activity
    await logActivity('delete', 'evidence', id, entityName, 'تم حذف الشاهد');

    // Save progress snapshot after evidence deletion
    await saveProgressSnapshot();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    return NextResponse.json({ error: 'Failed to delete evidence' }, { status: 500 });
  }
}
