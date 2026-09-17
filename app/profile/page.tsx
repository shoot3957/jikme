'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import { useTeamsAndTags } from '@/lib/useTeamsAndTags';
import TeamPicker from '@/components/profile/TeamPicker';
import TagPicker from '@/components/profile/TagPicker';
import BioInput from '@/components/profile/BioInput';
import ImageUploader from '@/components/ImageUploader';

export default function ProfilePage() {
  const router = useRouter();
  const { teams, tags } = useTeamsAndTags();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [nickname, setNickname] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [favoriteTeamId, setFavoriteTeamId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [watchCount, setWatchCount] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/users/me');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const me = await res.json();
      setNickname(me.nickname ?? '');
      setImage(me.image ?? null);
      setCoverImage(me.coverImage ?? null);
      setBio(me.bio ?? '');
      setFavoriteTeamId(me.favoriteTeamId ?? null);
      setSelectedTagIds((me.tags ?? []).map((t: { id: number }) => t.id));
      setWatchCount(me.watchCount ?? 0);
      setCheckingAuth(false);
    }
    init();
  }, [router]);

  async function handleSave() {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const patchRes = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          bio,
          favoriteTeamId,
          ...(image ? { image } : {}),
          ...(coverImage ? { coverImage } : {}),
        }),
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

      setSuccess('프로필이 저장됐어요.');
      router.refresh();
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
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 pb-16`}>
      <div className="mx-auto w-full max-w-xl px-6 pt-8">
        <h1 className="text-2xl font-bold text-ink-900">프로필</h1>
        <p className="mt-1 text-sm text-ink-900/60">직관 메이트에게 보여질 정보를 관리하세요.</p>

        <div className="mt-8">
          <ImageUploader
            currentUrl={coverImage}
            onUploaded={setCoverImage}
            shape="square"
            label="커버 이미지 선택"
            className="h-40 w-full sm:h-48"
          />

          <div className="-mt-12 pl-2">
            <ImageUploader
              currentUrl={image}
              onUploaded={setImage}
              shape="circle"
              label="사진"
              className="h-24 w-24 border-4 border-chalk-50 bg-chalk-50 shadow-sm"
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-6 rounded-md border-l-4 border-field-600 bg-field-600/5 px-4 py-3 text-sm text-ink-900"
          >
            {success}
          </p>
        )}

        <div className="mt-6 space-y-8">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <p className="mt-1.5 text-xs text-ink-900/40">직관 {watchCount}회</p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">응원팀</h2>
            <TeamPicker teams={teams} value={favoriteTeamId} onChange={setFavoriteTeamId} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">성향 태그</h2>
            <TagPicker tags={tags} value={selectedTagIds} onChange={setSelectedTagIds} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">한줄 소개</h2>
            <BioInput value={bio} onChange={setBio} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="mt-10 w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
