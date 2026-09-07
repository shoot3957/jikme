import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { doHyeon, plexSansKr } from '@/lib/fonts';

const STATUS_LABEL: Record<string, string> = { OPEN: '모집중', MATCHED: '매칭완료', CLOSED: '마감' };
const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-field-600/10 text-field-600',
  MATCHED: 'bg-gold-500/15 text-gold-600',
  CLOSED: 'bg-ink-900/10 text-ink-900/40',
};

function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  const existing = await prisma.post.findUnique({
    where: { id: params.postId },
    select: { id: true, matchDate: true, status: true },
  });
  if (!existing) notFound();

  if (existing.matchDate.getTime() < Date.now() && existing.status !== 'CLOSED') {
    await prisma.post.update({ where: { id: existing.id }, data: { status: 'CLOSED' } });
  }

  const post = await prisma.post.findUnique({
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
      _count: { select: { comments: true, applications: { where: { status: 'ACCEPTED' } } } },
    },
  });

  if (!post) notFound();

  const filled = post._count.applications + 1;

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12`}>
      <div className="mx-auto w-full max-w-2xl">
        <Link href={`/teams/${post.team.shortCode}`} className="text-sm text-ink-900/50 hover:text-ink-900">
          ← {post.team.name} 게시판
        </Link>

        <div className="mt-4 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink-900">{post.title}</h1>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}>
            {STATUS_LABEL[post.status]}
          </span>
        </div>

        <p className="mt-2 text-sm text-ink-900/60">{formatMatchDate(post.matchDate)}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.opponent && (
            <span className="rounded-full border border-ink-900/15 px-2.5 py-0.5 text-xs text-ink-900/60">
              vs {post.opponent}
            </span>
          )}
          {post.stadiumZone && (
            <span className="rounded-full border border-dirt-500/40 bg-dirt-500/10 px-2.5 py-0.5 text-xs text-ink-900/60">
              {post.stadiumZone}
            </span>
          )}
          <span className="rounded-full border border-field-600/30 bg-field-600/5 px-2.5 py-0.5 text-xs text-field-600">
            {filled}/{post.capacity}명 모집 완료
          </span>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-900/80">{post.content}</p>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-sm font-semibold text-ink-900">
            {post.author.nickname.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">{post.author.nickname}</p>
            <p className="mt-0.5 text-xs text-ink-900/50">
              {post.author.favoriteTeam ? `${post.author.favoriteTeam.name} 팬` : '응원팀 미설정'}
            </p>
            <p className="text-xs text-ink-900/50">직관 {post.author.watchCount}회</p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-lg bg-ink-900/10 py-2.5 text-sm font-semibold text-ink-900/40"
        >
          신청하기 (준비중)
        </button>

        <div className="mt-10 border-t border-ink-900/10 pt-6">
          <h2 className="text-sm font-semibold text-ink-900">댓글</h2>
          <p className="mt-3 rounded-xl border border-dashed border-ink-900/15 px-6 py-10 text-center text-sm text-ink-900/40">
            댓글 기능 준비중이에요.
          </p>
        </div>
      </div>
    </div>
  );
}
