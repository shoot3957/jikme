import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import CommentSection from '@/components/posts/CommentSection';
import BoardPostActions from '@/components/board/BoardPostActions';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default async function BoardPostDetailPage({ params }: { params: { postId: string } }) {
  const [post, userId] = await Promise.all([
    prisma.boardPost.findUnique({
      where: { id: params.postId },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            watchCount: true,
            favoriteTeam: { select: { name: true } },
          },
        },
        team: { select: { id: true, name: true, shortCode: true } },
      },
    }),
    getCurrentUserId(),
  ]);

  if (!post) notFound();

  const comments = await prisma.boardComment.findMany({
    where: { boardPostId: post.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, nickname: true } },
    },
  });

  const isAuthor = userId === post.author.id;

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12`}>
      <div className="mx-auto w-full max-w-2xl">
        <Link href={`/teams/${post.team.shortCode}/board`} className="text-sm text-ink-900/50 hover:text-ink-900">
          ← {post.team.name} 자유게시판
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-ink-900">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-900/60">{formatDate(post.createdAt)}</p>

        {post.images.length > 0 &&
          (post.images.length === 1 ? (
            <div className="mt-6 overflow-hidden rounded-xl bg-ink-900/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.images[0]} alt="" className="max-h-[480px] w-full object-cover" />
            </div>
          ) : (
            <div className="mt-6 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
              {post.images.map((url, i) => (
                <div
                  key={url}
                  className="h-72 w-full shrink-0 snap-center overflow-hidden rounded-xl bg-ink-900/5 sm:w-[calc(100%-2rem)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`이미지 ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ))}

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-900/80">{post.content}</p>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-sm font-semibold text-ink-900">
            {post.author.nickname.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-900">{post.author.nickname}</p>
            <p className="mt-0.5 text-xs text-ink-900/50">
              {post.author.favoriteTeam ? `${post.author.favoriteTeam.name} 팬` : '응원팀 미설정'} · 직관{' '}
              {post.author.watchCount}회
            </p>
          </div>
          {isAuthor && <BoardPostActions postId={post.id} teamShortCode={post.team.shortCode} />}
        </div>

        <CommentSection
          commentsEndpoint={`/api/board/${post.id}/comments`}
          deleteEndpointBase="/api/board-comments"
          initialComments={comments.map((comment) => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
          }))}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}
