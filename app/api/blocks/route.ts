import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createBlockSchema } from '@/lib/validations/block';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { blockedId } = parsed.data;

  if (blockedId === userId) {
    return NextResponse.json({ error: '본인을 차단할 수 없습니다.' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: '대상 유저를 찾을 수 없습니다.' }, { status: 404 });
  }

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId } },
  });
  if (existing) {
    return NextResponse.json({ error: '이미 차단한 유저입니다.' }, { status: 409 });
  }

  try {
    const block = await prisma.block.create({
      data: { blockerId: userId, blockedId },
    });
    return NextResponse.json(block, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: '이미 차단한 유저입니다.' }, { status: 409 });
    }
    throw e;
  }
}
