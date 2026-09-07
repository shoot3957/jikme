'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doHyeon, plexSansKr } from '@/lib/fonts';

type Team = { id: number; name: string; shortCode: string };

export default function NewPostPage() {
  return (
    <Suspense fallback={null}>
      <NewPostForm />
    </Suspense>
  );
}

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);

  const [teamId, setTeamId] = useState(searchParams.get('teamId') ?? '');
  const [title, setTitle] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [opponent, setOpponent] = useState('');
  const [stadiumZone, setStadiumZone] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [content, setContent] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const [meRes, teamsRes] = await Promise.all([fetch('/api/users/me'), fetch('/api/teams')]);

      if (meRes.status === 401) {
        router.replace('/login');
        return;
      }

      const teamsData: Team[] = await teamsRes.json();
      setTeams(teamsData);
      setCheckingAuth(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!teamId) {
      setError('구단을 선택해주세요.');
      return;
    }
    if (!matchDate) {
      setError('경기 날짜/시간을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: Number(teamId),
          title,
          content,
          matchDate: new Date(matchDate).toISOString(),
          opponent: opponent.trim() || undefined,
          stadiumZone: stadiumZone.trim() || undefined,
          capacity: Number(capacity),
        }),
      });

      if (res.status === 201) {
        const post = await res.json();
        router.push(`/posts/${post.id}`);
        return;
      }

      const data = await res.json().catch(() => null);
      setError(data?.errors?.[0] ?? data?.error ?? '모집글 작성에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk-50">
        <p className="text-sm text-ink-900/50">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12`}>
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-bold text-ink-900">모집글 작성</h1>
        <p className="mt-1 text-sm text-ink-900/60">같이 갈 메이트에게 보여줄 정보를 채워주세요.</p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">구단</label>
            <select
              required
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="" disabled>
                구단을 선택하세요
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">제목</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="이번 주 토요일 잠실 직관 메이트 구해요"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">경기 날짜/시간</label>
            <input
              type="datetime-local"
              required
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900/80">상대 구단 (선택)</label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="두산"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900/80">모집 인원</label>
              <input
                type="number"
                required
                min={2}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">응원 구역 (선택)</label>
            <input
              type="text"
              value={stadiumZone}
              onChange={(e) => setStadiumZone(e.target.value)}
              className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="3루 익사이팅존"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">내용</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="3루 익사이팅존에서 같이 응원하실 분 구해요!"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '모집글 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
