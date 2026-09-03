import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { updateProfileSchema } from '@/lib/validations/profile';

const profileSelect = {
  id: true,
  email: true,
  nickname: true,
  image: true,
  bio: true,
  watchCount: true,
  favoriteTeamId: true,
  favoriteTeam: { select: { id: true, name: true, shortCode: true } },
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...profileSelect, tags: { select: { tag: { select: { id: true, name: true } } } } },
  });

  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ ...user, tags: user.tags.map((t) => t.tag) });
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ errors: ['요청 본문이 올바르지 않습니다.'] }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const { favoriteTeamId, ...rest } = parsed.data;

  if (favoriteTeamId !== undefined) {
    const team = await prisma.team.findUnique({ where: { id: favoriteTeamId } });
    if (!team) {
      return NextResponse.json({ errors: ['존재하지 않는 구단입니다.'] }, { status: 400 });
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...rest, ...(favoriteTeamId !== undefined ? { favoriteTeamId } : {}) },
      select: profileSelect,
    });
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
    }
    throw err;
  }
}
