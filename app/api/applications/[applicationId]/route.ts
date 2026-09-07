import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { updateApplicationStatusSchema } from '@/lib/validations/application';

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { applicationId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateApplicationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }
  const { status } = parsed.data;

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    select: { id: true, postId: true, post: { select: { authorId: true } } },
  });
  if (!application) {
    return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (application.post.authorId !== userId) {
    return NextResponse.json({ error: '작성자만 처리할 수 있습니다.' }, { status: 403 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 같은 모집글에 대한 동시 수락/거절 처리를 직렬화하기 위해 Post 행에 잠금을 건다.
      // (동시에 여러 신청이 수락되면서 정원을 초과하는 것을 방지)
      await tx.$queryRaw`SELECT id FROM "Post" WHERE id = ${application.postId} FOR UPDATE`;

      const current = await tx.application.findUnique({ where: { id: params.applicationId } });
      if (!current || current.status !== 'PENDING') {
        throw new HttpError(400, '이미 처리된 신청입니다.');
      }

      const result = await tx.application.update({
        where: { id: params.applicationId },
        data: { status },
      });

      if (status === 'ACCEPTED') {
        const post = await tx.post.findUniqueOrThrow({
          where: { id: application.postId },
          select: { capacity: true },
        });
        const acceptedCount = await tx.application.count({
          where: { postId: application.postId, status: 'ACCEPTED' },
        });

        if (acceptedCount >= post.capacity - 1) {
          await tx.post.update({ where: { id: application.postId }, data: { status: 'MATCHED' } });
          await tx.application.updateMany({
            where: { postId: application.postId, status: 'PENDING' },
            data: { status: 'REJECTED' },
          });
        }
      }

      return result;
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { applicationId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    select: { id: true, applicantId: true, status: true },
  });
  if (!application) {
    return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (application.applicantId !== userId) {
    return NextResponse.json({ error: '본인만 취소할 수 있습니다.' }, { status: 403 });
  }
  if (application.status !== 'PENDING') {
    return NextResponse.json({ error: '대기중인 신청만 취소할 수 있습니다.' }, { status: 400 });
  }

  const { count } = await prisma.application.deleteMany({
    where: { id: params.applicationId, status: 'PENDING' },
  });
  if (count === 0) {
    return NextResponse.json({ error: '대기중인 신청만 취소할 수 있습니다.' }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
