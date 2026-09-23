import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { getMutuallyBlockedUserIds } from '@/lib/blocks';
import { createBoardPostSchema, listBoardPostsQuerySchema } from '@/lib/validations/board';

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  const team = await prisma.team.findUnique({ where: { shortCode: params.teamId } });
  if (!team) {
    return NextResponse.json({ error: '존재하지 않는 구단입니다.' }, { status: 404 });
  }

  const parsed = listBoardPostsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { page, limit } = parsed.data;

  const userId = await getCurrentUserId();
  const blockedUserIds = userId ? await getMutuallyBlockedUserIds(userId) : [];

  const posts = await prisma.boardPost.findMany({
    where: {
      teamId: team.id,
      ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit + 1,
    select: {
      id: true,
      title: true,
      images: true,
      createdAt: true,
      author: { select: { id: true, nickname: true } },
      _count: { select: { comments: true } },
    },
  });

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit).map(({ _count, ...post }) => ({
    ...post,
    commentCount: _count.comments,
  }));

  return NextResponse.json({ items, nextCursor: hasMore ? String(page + 1) : null });
}

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const team = await prisma.team.findUnique({ where: { shortCode: params.teamId } });
  if (!team) {
    return NextResponse.json({ error: '존재하지 않는 구단입니다.' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createBoardPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const post = await prisma.boardPost.create({
    data: { teamId: team.id, authorId: userId, ...parsed.data },
    include: {
      author: { select: { id: true, nickname: true } },
      team: { select: { id: true, name: true, shortCode: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
