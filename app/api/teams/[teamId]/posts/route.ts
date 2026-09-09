import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { getMutuallyBlockedUserIds } from '@/lib/blocks';
import { listPostsQuerySchema } from '@/lib/validations/post';

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  const team = await prisma.team.findUnique({ where: { shortCode: params.teamId } });
  if (!team) {
    return NextResponse.json({ error: '존재하지 않는 구단입니다.' }, { status: 404 });
  }

  const parsed = listPostsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { status, dateFrom, dateTo, sort, page, limit } = parsed.data;

  // 경기 날짜가 지난 모집글은 조회 시점에 자동 마감 처리 (매칭된 글은 완료 처리 대상이므로 제외)
  await prisma.post.updateMany({
    where: { teamId: team.id, matchDate: { lt: new Date() }, status: 'OPEN' },
    data: { status: 'CLOSED' },
  });

  const userId = await getCurrentUserId();
  const blockedUserIds = userId ? await getMutuallyBlockedUserIds(userId) : [];

  const posts = await prisma.post.findMany({
    where: {
      teamId: team.id,
      status: status ?? { in: ['OPEN', 'MATCHED'] },
      ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
      ...(dateFrom || dateTo
        ? {
            matchDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    orderBy: sort === 'matchDate' || sort === 'deadline' ? { matchDate: 'asc' } : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit + 1,
    select: {
      id: true,
      title: true,
      matchDate: true,
      opponent: true,
      stadiumZone: true,
      capacity: true,
      status: true,
      createdAt: true,
      author: { select: { id: true, nickname: true } },
      _count: { select: { applications: { where: { status: 'ACCEPTED' } } } },
    },
  });

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit).map(({ _count, ...post }) => ({
    ...post,
    acceptedCount: _count.applications,
  }));

  return NextResponse.json({ items, nextCursor: hasMore ? String(page + 1) : null });
}
