import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_PASSWORD = 'qurtubah2024';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === ADMIN_PASSWORD) {
      const admin = await db.user.upsert({
        where: { email: 'admin@qurtubah.edu.sa' },
        update: { role: 'admin' },
        create: {
          name: 'مدير النظام',
          email: 'admin@qurtubah.edu.sa',
          role: 'admin',
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        token: Buffer.from(`${admin.email}:${Date.now()}`).toString('base64'),
      });
    }

    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  } catch (error) {
    console.error('Error in auth setup:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
