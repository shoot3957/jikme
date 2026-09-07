import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { applicantId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          matchDate: true,
          status: true,
          team: { select: { id: true, name: true, shortCode: true } },
        },
      },
    },
  });

  return NextResponse.json({ items: applications });
}
