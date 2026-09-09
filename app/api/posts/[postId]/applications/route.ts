import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createNotification } from '@/lib/notifications';
import { createApplicationSchema } from '@/lib/validations/application';

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createApplicationSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true, status: true, title: true },
  });
  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (post.authorId === userId) {
    return NextResponse.json({ error: '본인 글에는 신청할 수 없습니다.' }, { status: 400 });
  }

  if (post.status === 'CLOSED' || post.status === 'MATCHED') {
    return NextResponse.json({ error: '이미 마감된 모집글입니다.' }, { status: 400 });
  }

  const existing = await prisma.application.findUnique({
    where: { postId_applicantId: { postId: post.id, applicantId: userId } },
  });
  if (existing) {
    return NextResponse.json({ error: '이미 신청한 모집글입니다.' }, { status: 409 });
  }

  try {
    const application = await prisma.application.create({
      data: { postId: post.id, applicantId: userId, message: parsed.data.message },
    });

    const applicant = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } });
    await createNotification({
      userId: post.authorId,
      type: 'NEW_APPLICATION',
      message: `${applicant?.nickname ?? '누군가'}님이 "${post.title}"에 신청했어요`,
      link: `/posts/${post.id}`,
    });

    return NextResponse.json(application, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: '이미 신청한 모집글입니다.' }, { status: 409 });
    }
    throw e;
  }
}

export async function GET(_req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true },
  });
  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (post.authorId !== userId) {
    return NextResponse.json({ error: '작성자만 조회할 수 있습니다.' }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: 'asc' },
    include: {
      applicant: {
        select: {
          id: true,
          nickname: true,
          watchCount: true,
          favoriteTeam: { select: { id: true, name: true, shortCode: true } },
        },
      },
    },
  });

  return NextResponse.json({ items: applications });
}
