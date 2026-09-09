import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

export async function POST(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const room = await prisma.room.findUnique({ where: { id: params.roomId }, select: { id: true } });
  if (!room) {
    return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 });
  }

  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId } },
  });
  if (!participant) {
    return NextResponse.json({ error: '참여자만 나갈 수 있습니다.' }, { status: 403 });
  }

  await prisma.roomParticipant.update({
    where: { roomId_userId: { roomId: params.roomId, userId } },
    data: { leftAt: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
