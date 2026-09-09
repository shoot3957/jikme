import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function POST(_req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true, isCompleted: true, matchDate: true, title: true },
  });
  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.authorId !== userId) {
    return NextResponse.json({ error: '작성자만 완료 처리할 수 있습니다.' }, { status: 403 });
  }
  if (post.isCompleted) {
    return NextResponse.json({ error: '이미 완료 처리된 모집글입니다.' }, { status: 400 });
  }
  if (post.matchDate.getTime() >= Date.now()) {
    return NextResponse.json({ error: '경기 날짜 이후에만 완료 처리할 수 있습니다.' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // isCompleted: false 조건으로 원자적으로 완료 처리를 선점 (동시 완료 처리로 인한 중복 집계 방지)
      const claimed = await tx.post.updateMany({
        where: { id: post.id, isCompleted: false },
        data: { isCompleted: true, completedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new HttpError(400, '이미 완료 처리된 모집글입니다.');
      }

      const acceptedApplicants = await tx.application.findMany({
        where: { postId: post.id, status: 'ACCEPTED' },
        select: { applicantId: true },
      });
      const watchCountUpdated = [post.authorId, ...acceptedApplicants.map((a) => a.applicantId)];

      await tx.user.updateMany({
        where: { id: { in: watchCountUpdated } },
        data: { watchCount: { increment: 1 } },
      });

      const updatedPost = await tx.post.findUniqueOrThrow({
        where: { id: post.id },
        select: { completedAt: true },
      });

      return { completedAt: updatedPost.completedAt, watchCountUpdated };
    });

    for (const applicantId of result.watchCountUpdated) {
      if (applicantId === post.authorId) continue;
      await createNotification({
        userId: applicantId,
        type: 'WATCH_COMPLETED',
        message: `"${post.title}" 직관이 완료 처리됐어요. 직관 횟수가 올랐어요!`,
        link: `/posts/${post.id}`,
      });
    }

    return NextResponse.json({
      postId: post.id,
      completedAt: result.completedAt,
      watchCountUpdated: result.watchCountUpdated,
    });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
