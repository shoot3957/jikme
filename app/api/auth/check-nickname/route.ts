import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nicknameQuerySchema } from '@/lib/validations/auth';

export async function GET(req: NextRequest) {
  const nickname = req.nextUrl.searchParams.get('nickname');

  const parsed = nicknameQuerySchema.safeParse({ nickname });
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { nickname: parsed.data.nickname },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
