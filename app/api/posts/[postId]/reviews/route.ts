import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createReviewSchema } from '@/lib/validations/review';

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
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

  const body = await req.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { revieweeId, type, tags, comment } = parsed.data;

  if (revieweeId === userId) {
    return NextResponse.json({ error: '본인에게는 후기를 남길 수 없습니다.' }, { status: 400 });
  }
  if (!participantIds.includes(revieweeId)) {
    return NextResponse.json({ error: '이 모집글의 참여자가 아닙니다.' }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({
    where: { postId_reviewerId_revieweeId: { postId: post.id, reviewerId: userId, revieweeId } },
  });
  if (existing) {
    return NextResponse.json({ error: '이미 후기를 남겼습니다.' }, { status: 409 });
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { postId: post.id, reviewerId: userId, revieweeId, type, tags, comment },
      });

      // 0~99 범위로 원자적으로 clamp (동시 후기 등록 시 경쟁 조건 없이 정확한 값 유지)
      const delta = type === 'POSITIVE' ? 0.1 : -0.1;
      await tx.$executeRaw`UPDATE "User" SET "mannerTemperature" = LEAST(99, GREATEST(0, "mannerTemperature" + ${delta})) WHERE id = ${revieweeId}`;

      return created;
    });

    // 누가 어떤 후기를 남겼는지 상대가 바로 알면 부담스러울 수 있어 알림은 보내지 않는다.
    return NextResponse.json(review, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: '이미 후기를 남겼습니다.' }, { status: 409 });
    }
    throw e;
  }
}
