import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import ApplicantManager from '@/components/posts/ApplicantManager';
import ApplyWidget from '@/components/posts/ApplyWidget';
import CompleteAction from '@/components/posts/CompleteAction';
import CommentSection from '@/components/posts/CommentSection';
import ReportBlockMenu from '@/components/ReportBlockMenu';

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

  // 경기 날짜가 지난 모집글은 조회 시점에 자동 마감 처리 (매칭된 글은 완료 처리 대상이므로 제외)
  if (existing.matchDate.getTime() < Date.now() && existing.status === 'OPEN') {
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
  const matchDatePassed = post.matchDate.getTime() < Date.now();
  const userId = await getCurrentUserId();
  const isAuthor = userId === post.author.id;
  const canComplete = isAuthor && !post.isCompleted && post.status === 'MATCHED' && matchDatePassed;

  const [applications, myApplication, comments] = await Promise.all([
    isAuthor
      ? prisma.application.findMany({
          where: { postId: post.id },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            message: true,
            status: true,
            applicant: {
              select: {
                id: true,
                nickname: true,
                watchCount: true,
                favoriteTeam: { select: { name: true } },
              },
            },
          },
        })
      : Promise.resolve(null),
    !isAuthor && userId
      ? prisma.application.findUnique({
          where: { postId_applicantId: { postId: post.id, applicantId: userId } },
          select: { id: true, status: true },
        })
      : Promise.resolve(null),
    prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, nickname: true } },
      },
    }),
  ]);

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12`}>
      <div className="mx-auto w-full max-w-2xl">
        <Link href={`/teams/${post.team.shortCode}`} className="text-sm text-ink-900/50 hover:text-ink-900">
          ← {post.team.name} 게시판
        </Link>

        <div className="mt-4 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink-900">{post.title}</h1>
          <div className="flex shrink-0 items-center gap-1.5">
            {post.isCompleted && (
              <span className="rounded-full bg-field-600/10 px-2.5 py-1 text-xs font-medium text-field-600">
                직관 완료
              </span>
            )}
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}>
              {STATUS_LABEL[post.status]}
            </span>
          </div>
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
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-900">{post.author.nickname}</p>
            <p className="mt-0.5 text-xs text-ink-900/50">
              {post.author.favoriteTeam ? `${post.author.favoriteTeam.name} 팬` : '응원팀 미설정'}
            </p>
            <p className="text-xs text-ink-900/50">직관 {post.author.watchCount}회</p>
          </div>
          {!isAuthor && <ReportBlockMenu targetUserId={post.author.id} currentUserId={userId} />}
        </div>

        {isAuthor ? (
          <ApplicantManager applications={applications ?? []} currentUserId={userId} />
        ) : (
          <ApplyWidget
            postId={post.id}
            postStatus={post.status}
            isLoggedIn={Boolean(userId)}
            myApplication={myApplication}
          />
        )}

        {isAuthor && post.isCompleted && (
          <p className="mt-6 rounded-lg bg-field-600/10 px-4 py-3 text-center text-sm font-semibold text-field-600">
            직관 완료됨 (참여자 {filled}명 직관 횟수 반영)
          </p>
        )}

        {canComplete && <CompleteAction postId={post.id} participantCount={filled} />}

        <CommentSection
          postId={post.id}
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
