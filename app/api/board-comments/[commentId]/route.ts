import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const comment = await prisma.boardComment.findUnique({
    where: { id: params.commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (comment.authorId !== userId) {
    return NextResponse.json({ error: '작성자만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await prisma.boardComment.delete({ where: { id: params.commentId } });

  return new NextResponse(null, { status: 204 });
}
