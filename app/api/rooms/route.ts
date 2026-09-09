import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { isBlockedEitherWay } from '@/lib/blocks';
import { createRoomSchema } from '@/lib/validations/room';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const participations = await prisma.roomParticipant.findMany({
    where: { userId, leftAt: null },
    include: {
      room: {
        include: {
          participants: {
            where: { userId: { not: userId } },
            select: { user: { select: { id: true, nickname: true, image: true } } },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true },
          },
          _count: {
            select: { messages: { where: { senderId: { not: userId }, readAt: null } } },
          },
        },
      },
    },
  });

  const items = participations
    .map((p) => {
      const lastMessage = p.room.messages[0] ?? null;
      return {
        roomId: p.room.id,
        otherUser: p.room.participants[0]?.user ?? null,
        lastMessage,
        unreadCount: p.room._count.messages,
        sortKey: (lastMessage?.createdAt ?? p.room.createdAt).getTime(),
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey: _sortKey, ...rest }) => rest);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { targetUserId } = parsed.data;

  if (targetUserId === userId) {
    return NextResponse.json({ error: '본인과는 대화할 수 없습니다.' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: '대상 유저를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (await isBlockedEitherWay(userId, targetUserId)) {
    return NextResponse.json({ error: '차단 관계인 유저와는 대화할 수 없습니다.' }, { status: 403 });
  }

  const existingRoom = await prisma.room.findFirst({
    where: {
      AND: [{ participants: { some: { userId } } }, { participants: { some: { userId: targetUserId } } }],
    },
    select: { id: true },
  });

  if (existingRoom) {
    // 나갔다가 같은 상대와 다시 대화를 시작하는 경우 참여 상태를 복구한다.
    await prisma.roomParticipant.update({
      where: { roomId_userId: { roomId: existingRoom.id, userId } },
      data: { leftAt: null },
    });
    return NextResponse.json({ roomId: existingRoom.id });
  }

  const room = await prisma.room.create({
    data: { participants: { create: [{ userId }, { userId: targetUserId }] } },
  });

  return NextResponse.json({ roomId: room.id }, { status: 201 });
}
