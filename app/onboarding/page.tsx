'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doHyeon, plexSansKr } from '@/lib/fonts';

type Team = { id: number; name: string; shortCode: string };
type Tag = { id: number; name: string };

const TEAM_COLORS: Record<string, string> = {
  doosan: '#131230',
  lg: '#C30452',
  kt: '#000000',
  samsung: '#074CA1',
  lotte: '#041E42',
  hanwha: '#FF6600',
  kia: '#EA0029',
  ssg: '#CE0E2D',
  nc: '#315288',
  kiwoom: '#570514',
};

const STEP_LABELS = ['응원팀', '성향 태그', '한줄소개'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState(0);

  const [teams, setTeams] = useState<Team[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [favoriteTeamId, setFavoriteTeamId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const [meRes, teamsRes, tagsRes] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/teams'),
        fetch('/api/tags'),
      ]);

      if (meRes.status === 401) {
        router.replace('/login');
        return;
      }

      const [me, teamsData, tagsData] = await Promise.all([
        meRes.json(),
        teamsRes.json(),
        tagsRes.json(),
      ]);

      setTeams(teamsData);
      setTags(tagsData);
      setFavoriteTeamId(me.favoriteTeamId ?? null);
      setSelectedTagIds((me.tags ?? []).map((t: Tag) => t.id));
      setBio(me.bio ?? '');
      setCheckingAuth(false);
    }
    init();
  }, [router]);

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= 5) return prev;
      return [...prev, tagId];
    });
  }

  const canProceedStep0 = favoriteTeamId !== null;

  async function handleComplete() {
    setError('');
    setSubmitting(true);
    try {
      const patchRes = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteTeamId, bio }),
      });
      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => null);
        setError(data?.errors?.[0] ?? data?.error ?? '프로필 저장에 실패했습니다.');
        setSubmitting(false);
        return;
      }

      const tagsRes = await fetch('/api/users/me/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: selectedTagIds }),
      });
      if (!tagsRes.ok) {
        const data = await tagsRes.json().catch(() => null);
        setError(data?.errors?.[0] ?? data?.error ?? '태그 저장에 실패했습니다.');
        setSubmitting(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
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
    <div
      className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12 lg:py-20`}
    >
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-10 flex items-center justify-center">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  aria-hidden
                  className={`h-3.5 w-3.5 rotate-45 rounded-[2px] border-2 transition-colors ${
                    i <= step ? 'border-field-600 bg-field-600' : 'border-ink-900/20 bg-transparent'
                  }`}
                />
                <span className={`text-xs ${i === step ? 'font-medium text-ink-900' : 'text-ink-900/40'}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  aria-hidden
                  className={`mx-3 h-px w-8 sm:w-14 ${i < step ? 'bg-field-600' : 'bg-ink-900/15'}`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
          >
            {error}
          </p>
        )}

        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-ink-900">어느 팀을 응원하세요?</h1>
            <p className="mt-1 text-sm text-ink-900/60">응원팀 게시판에서 메이트를 찾을 수 있어요.</p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {teams.map((team) => {
                const selected = favoriteTeamId === team.id;
                const color = TEAM_COLORS[team.shortCode] ?? '#0F1B2D';
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setFavoriteTeamId(team.id)}
                    style={selected ? { borderColor: color, backgroundColor: `${color}0D` } : undefined}
                    className={`rounded-xl border-2 px-4 py-4 text-sm font-medium transition ${
                      selected
                        ? 'text-ink-900'
                        : 'border-ink-900/10 text-ink-900/70 hover:border-ink-900/25'
                    }`}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-ink-900">어떤 스타일로 관람하세요?</h1>
            <p className="mt-1 text-sm text-ink-900/60">
              최대 5개까지 고를 수 있어요. ({selectedTagIds.length}/5)
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? 'border-gold-500 bg-gold-500 text-ink-900'
                        : 'border-ink-900/15 text-ink-900/70 hover:border-ink-900/30'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-ink-900">한줄 소개를 남겨주세요</h1>
            <p className="mt-1 text-sm text-ink-900/60">프로필에 표시돼요. 나중에 바꿀 수 있어요.</p>

            <div className="mt-8">
              <textarea
                value={bio}
                maxLength={50}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="예: 3루 익사이팅존에서 목청껏 응원하는 걸 좋아해요"
                className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              <p className="mt-1.5 text-right text-xs text-ink-900/40">{bio.length}/50</p>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-ink-900/60 transition hover:text-ink-900"
            >
              이전
            </button>
          ) : (
            <div />
          )}

          {step < STEP_LABELS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !canProceedStep0}
              className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting}
              className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
