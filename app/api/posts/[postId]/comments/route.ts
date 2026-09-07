import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { createCommentSchema } from '@/lib/validations/comment';

export async function GET(_req: NextRequest, { params }: { params: { postId: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.postId }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, nickname: true } },
    },
  });

  return NextResponse.json({ items: comments });
}

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id: params.postId }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: '모집글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: userId, content: parsed.data.content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, nickname: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
