import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: { blockedId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { count } = await prisma.block.deleteMany({
    where: { blockerId: userId, blockedId: params.blockedId },
  });
  if (count === 0) {
    return NextResponse.json({ error: '차단 내역을 찾을 수 없습니다.' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
