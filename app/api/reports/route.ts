import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createReportSchema } from '@/lib/validations/report';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { targetUserId, reason } = parsed.data;

  if (targetUserId === userId) {
    return NextResponse.json({ error: '본인을 신고할 수 없습니다.' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: '대상 유저를 찾을 수 없습니다.' }, { status: 404 });
  }

  const report = await prisma.report.create({
    data: { reporterId: userId, targetUserId, reason },
  });

  return NextResponse.json(report, { status: 201 });
}
