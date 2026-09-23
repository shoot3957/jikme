import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listReviewsQuerySchema } from '@/lib/validations/review';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const parsed = listReviewsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { page, limit } = parsed.data;

  // reviewerId/reviewer는 의도적으로 select하지 않음 — 누가 남겼는지 알 수 없도록(익명성)
  const reviews = await prisma.review.findMany({
    where: { revieweeId: params.userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit + 1,
    select: { id: true, type: true, tags: true, comment: true, createdAt: true },
  });

  const hasMore = reviews.length > limit;
  const items = reviews.slice(0, limit);

  return NextResponse.json({ items, nextCursor: hasMore ? String(page + 1) : null });
}
