import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { isBlockedEitherWay } from '@/lib/blocks';

export async function GET(_req: NextRequest, { params }: { params: { postId: string } }) {
  const existing = await prisma.post.findUnique({
    where: { id: params.postId },
    select: { id: true, matchDate: true, status: true, authorId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  if (userId && (await isBlockedEitherWay(userId, existing.authorId))) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 경기 날짜가 지난 모집글은 조회 시점에 자동 마감 처리 (매칭된 글은 완료 처리 대상이므로 제외)
  if (existing.matchDate.getTime() < Date.now() && existing.status === 'OPEN') {
    await prisma.post.update({ where: { id: existing.id }, data: { status: 'CLOSED' } });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: {
      author: {
        select: {
          id: true,
          nickname: true,
          image: true,
          watchCount: true,
          favoriteTeam: { select: { id: true, name: true, shortCode: true } },
        },
      },
      team: { select: { id: true, name: true, shortCode: true } },
      _count: {
        select: { comments: true, applications: { where: { status: 'ACCEPTED' } } },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const { _count, ...rest } = post;
  return NextResponse.json({
    ...rest,
    commentCount: _count.comments,
    acceptedCount: _count.applications,
  });
}
