import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!notification) {
    return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (notification.userId !== userId) {
    return NextResponse.json({ error: '본인 알림만 처리할 수 있습니다.' }, { status: 403 });
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}
