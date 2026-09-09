import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { listNotificationsQuerySchema } from '@/lib/validations/notification';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const parsed = listNotificationsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { page, limit } = parsed.data;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit + 1,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const hasMore = notifications.length > limit;
  return NextResponse.json({
    items: notifications.slice(0, limit),
    nextCursor: hasMore ? String(page + 1) : null,
    unreadCount,
  });
}
