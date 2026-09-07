import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createPostSchema } from '@/lib/validations/post';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ errors: ['요청 본문이 올바르지 않습니다.'] }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const { teamId, ...rest } = parsed.data;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return NextResponse.json({ errors: ['존재하지 않는 구단입니다.'] }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: { ...rest, teamId, authorId: userId },
    include: {
      author: { select: { id: true, nickname: true } },
      team: { select: { id: true, name: true, shortCode: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
