import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { listMessagesQuerySchema } from '@/lib/validations/room';

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
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
    return NextResponse.json({ error: '참여자만 조회할 수 있습니다.' }, { status: 403 });
  }

  const parsed = listMessagesQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { cursor, limit } = parsed.data;

  const otherParticipant = await prisma.roomParticipant.findFirst({
    where: { roomId: params.roomId, userId: { not: userId } },
    select: { user: { select: { id: true, nickname: true, image: true } } },
  });

  const raw = await prisma.message.findMany({
    where: {
      roomId: params.roomId,
      ...(participant.leftAt ? { createdAt: { gt: participant.leftAt } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = raw.length > limit;
  const page = raw.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1].id : null;
  const items = page.reverse();

  return NextResponse.json({ items, nextCursor, otherUser: otherParticipant?.user ?? null });
}
