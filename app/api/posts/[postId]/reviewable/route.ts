import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

export async function GET(_req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true, isCompleted: true },
  });
  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const acceptedApplicants = await prisma.application.findMany({
    where: { postId: post.id, status: 'ACCEPTED' },
    select: { applicantId: true },
  });
  const participantIds = [post.authorId, ...acceptedApplicants.map((a) => a.applicantId)];

  if (!participantIds.includes(userId)) {
    return NextResponse.json({ error: '이 모집글의 참여자만 후기를 남길 수 있습니다.' }, { status: 403 });
  }
  if (!post.isCompleted) {
    return NextResponse.json({ error: '직관 완료 처리된 모집글만 후기를 남길 수 있습니다.' }, { status: 400 });
  }

  const myReviews = await prisma.review.findMany({
    where: { postId: post.id, reviewerId: userId },
    select: { revieweeId: true },
  });
  const reviewedIds = new Set(myReviews.map((r) => r.revieweeId));

  const otherParticipantIds = participantIds.filter((id) => id !== userId && !reviewedIds.has(id));

  const users = await prisma.user.findMany({
    where: { id: { in: otherParticipantIds } },
    select: { id: true, nickname: true, image: true },
  });
  const usersById = new Map(users.map((u) => [u.id, u]));
  const items = otherParticipantIds.map((id) => usersById.get(id)).filter((u): u is NonNullable<typeof u> => Boolean(u));

  return NextResponse.json({ items });
}
