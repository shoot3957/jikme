'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteAction({
  postId,
  participantCount,
}: {
  postId: string;
  participantCount: number;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleComplete() {
    if (!window.confirm('직관을 완료 처리할까요? 참여자 전원의 직관 횟수가 올라가요.')) return;

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/complete`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? '완료 처리에 실패했습니다.');
        return;
      }
      setCompleted(true);
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <p className="mt-6 rounded-lg bg-field-600/10 px-4 py-3 text-center text-sm font-semibold text-field-600">
        직관 완료됐어요. 참여자 {participantCount}명의 직관 횟수가 올라갔어요.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleComplete}
        disabled={submitting}
        className="w-full rounded-lg bg-field-600 py-2.5 text-sm font-semibold text-white transition hover:bg-field-700 disabled:opacity-50"
      >
        {submitting ? '처리 중...' : '직관 완료 처리'}
      </button>
    </div>
  );
}
