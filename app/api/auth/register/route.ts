import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ errors: ['요청 본문이 올바르지 않습니다.'] }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const { email, password, nickname } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
    select: { email: true, nickname: true },
  });

  if (existing) {
    const message =
      existing.email === email ? '이미 사용 중인 이메일입니다.' : '이미 사용 중인 닉네임입니다.';
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, nickname },
      select: { id: true, email: true, nickname: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일 또는 닉네임입니다.' },
        { status: 409 }
      );
    }
    throw err;
  }
}
