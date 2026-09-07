import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import { TEAM_COLORS } from '@/lib/teamColors';

const STATUS_LABEL: Record<string, string> = { OPEN: '모집중', MATCHED: '매칭완료', CLOSED: '마감' };
const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-field-600/10 text-field-600',
  MATCHED: 'bg-gold-500/15 text-gold-600',
  CLOSED: 'bg-ink-900/10 text-ink-900/40',
};

function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default async function TeamBoardPage({ params }: { params: { teamId: string } }) {
  const team = await prisma.team.findUnique({ where: { shortCode: params.teamId } });
  if (!team) notFound();

  await prisma.post.updateMany({
    where: { teamId: team.id, matchDate: { lt: new Date() }, status: { not: 'CLOSED' } },
    data: { status: 'CLOSED' },
  });

  const [posts, userId] = await Promise.all([
    prisma.post.findMany({
      where: { teamId: team.id, status: { in: ['OPEN', 'MATCHED'] } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        title: true,
        matchDate: true,
        stadiumZone: true,
        capacity: true,
        status: true,
        author: { select: { nickname: true } },
        _count: { select: { applications: { where: { status: 'ACCEPTED' } } } },
      },
    }),
    getCurrentUserId(),
  ]);

  const color = TEAM_COLORS[team.shortCode] ?? '#0F1B2D';
  const writeHref = userId ? `/posts/new?teamId=${team.id}` : '/login';

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
              모집글 작성
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink-900/60">같은 팀을 응원하는 메이트를 찾아보세요.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 lg:px-16">
        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-900/15 px-6 py-16 text-center text-sm text-ink-900/40">
            아직 모집글이 없어요. 첫 모집글을 올려보세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="block rounded-xl border border-ink-900/10 bg-white px-5 py-4 transition hover:border-ink-900/25 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-ink-900">{post.title}</h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}
                    >
                      {STATUS_LABEL[post.status]}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-ink-900/60">{formatMatchDate(post.matchDate)}</p>
                  {post.stadiumZone && (
                    <span className="mt-2 inline-block rounded-full border border-dirt-500/40 bg-dirt-500/10 px-2.5 py-0.5 text-xs text-ink-900/60">
                      {post.stadiumZone}
                    </span>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-ink-900/50">
                    <span>{post.author.nickname}</span>
                    <span>
                      {post._count.applications + 1}/{post.capacity}명 모집
                    </span>
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
