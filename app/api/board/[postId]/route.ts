import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { updateBoardPostSchema } from '@/lib/validations/board';

export async function GET(_req: NextRequest, { params }: { params: { postId: string } }) {
  const post = await prisma.boardPost.findUnique({
    where: { id: params.postId },
    include: {
      author: { select: { id: true, nickname: true, image: true, watchCount: true } },
      team: { select: { id: true, name: true, shortCode: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const { _count, ...rest } = post;
  return NextResponse.json({ ...rest, commentCount: _count.comments });
}

export async function PATCH(req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const post = await prisma.boardPost.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true },
  });
  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.authorId !== userId) {
    return NextResponse.json({ error: '작성자만 수정할 수 있습니다.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateBoardPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const updated = await prisma.boardPost.update({
    where: { id: post.id },
    data: parsed.data,
    include: {
      author: { select: { id: true, nickname: true } },
      team: { select: { id: true, name: true, shortCode: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const post = await prisma.boardPost.findUnique({
    where: { id: params.postId },
    select: { id: true, authorId: true },
  });
  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.authorId !== userId) {
    return NextResponse.json({ error: '작성자만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await prisma.boardPost.delete({ where: { id: post.id } });

  return new NextResponse(null, { status: 204 });
}
