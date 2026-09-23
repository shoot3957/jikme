'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BoardPostActions({
  postId,
  teamShortCode,
}: {
  postId: string;
  teamShortCode: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!window.confirm('게시글을 삭제할까요? 삭제하면 되돌릴 수 없어요.')) return;

    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/board/${postId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? '삭제에 실패했습니다.');
        setDeleting(false);
        return;
      }
      router.push(`/teams/${teamShortCode}/board`);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setDeleting(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href={`/board/${postId}/edit`}
        className="rounded-lg border border-ink-900/15 px-3 py-1.5 text-xs font-semibold text-ink-900/70 transition hover:border-ink-900/30"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg border border-stitch-600/30 px-3 py-1.5 text-xs font-semibold text-stitch-600 transition hover:border-stitch-600/50 disabled:opacity-50"
      >
        {deleting ? '삭제 중...' : '삭제'}
      </button>
      {error && <p className="text-xs text-stitch-600">{error}</p>}
    </div>
  );
}
