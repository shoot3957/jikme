import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { tagIdsSchema } from '@/lib/validations/profile';

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ errors: ['요청 본문이 올바르지 않습니다.'] }, { status: 400 });
  }

  const parsed = tagIdsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const tagIds = [...new Set(parsed.data.tagIds)];

  if (tagIds.length > 0) {
    const existingCount = await prisma.tag.count({ where: { id: { in: tagIds } } });
    if (existingCount !== tagIds.length) {
      return NextResponse.json({ errors: ['존재하지 않는 태그가 포함되어 있습니다.'] }, { status: 400 });
    }
  }

  const tags = await prisma.$transaction(async (tx) => {
    await tx.userTag.deleteMany({ where: { userId } });
    if (tagIds.length > 0) {
      await tx.userTag.createMany({ data: tagIds.map((tagId) => ({ userId, tagId })) });
    }
    return tx.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true, name: true } });
  });

  return NextResponse.json(tags);
}
