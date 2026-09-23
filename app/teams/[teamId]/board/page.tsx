import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { getMutuallyBlockedUserIds } from '@/lib/blocks';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import { TEAM_COLORS } from '@/lib/teamColors';
import BoardTabs from '@/components/teams/BoardTabs';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export default async function TeamFreeBoardPage({ params }: { params: { teamId: string } }) {
  const team = await prisma.team.findUnique({ where: { shortCode: params.teamId } });
  if (!team) notFound();

  const userId = await getCurrentUserId();
  const blockedUserIds = userId ? await getMutuallyBlockedUserIds(userId) : [];

  const posts = await prisma.boardPost.findMany({
    where: {
      teamId: team.id,
      ...(blockedUserIds.length > 0 ? { authorId: { notIn: blockedUserIds } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      title: true,
      images: true,
      createdAt: true,
      author: { select: { nickname: true } },
      _count: { select: { comments: true } },
    },
  });

  const color = TEAM_COLORS[team.shortCode] ?? '#0F1B2D';
  const writeHref = userId ? `/teams/${team.shortCode}/board/new` : '/login';

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50`}>
      <div
        className="border-b px-6 py-10 lg:px-16"
        style={{ borderColor: `${color}33`, background: `linear-gradient(180deg, ${color}14, transparent)` }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-3xl text-ink-900 lg:text-4xl">{team.name}</h1>
            <Link
              href={writeHref}
              className="shrink-0 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400"
            >
              글쓰기
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink-900/60">자유롭게 이야기 나누는 공간이에요.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 lg:px-16">
        <BoardTabs teamShortCode={team.shortCode} active="board" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 lg:px-16">
        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-900/15 px-6 py-16 text-center text-sm text-ink-900/40">
            아직 게시글이 없어요. 첫 글을 올려보세요.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/board/${post.id}`}
                  className="flex h-full gap-3 rounded-xl border border-ink-900/10 bg-white p-3 transition hover:border-ink-900/25 hover:shadow-sm"
                >
                  {post.images[0] ? (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-900/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.images[0]} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-ink-900/5 text-xs text-ink-900/30">
                      No Image
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <h2 className="line-clamp-2 text-sm font-semibold text-ink-900">{post.title}</h2>
                    <div className="flex items-center justify-between text-xs text-ink-900/50">
                      <span>{post.author.nickname}</span>
                      <span>
                        {formatDate(post.createdAt)}
                        {post._count.comments > 0 && ` · 댓글 ${post._count.comments}`}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
