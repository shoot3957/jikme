'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type MyApplication = { id: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' } | null;

export default function ApplyWidget({
  postId,
  postStatus,
  isLoggedIn,
  myApplication,
}: {
  postId: string;
  postStatus: 'OPEN' | 'MATCHED' | 'CLOSED';
  isLoggedIn: boolean;
  myApplication: MyApplication;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() || undefined }),
      });
      if (res.status === 201) {
        setShowForm(false);
        setMessage('');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.errors?.[0] ?? data?.error ?? '신청에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!myApplication) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${myApplication.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? '취소에 실패했습니다.');
        return;
      }
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (myApplication?.status === 'ACCEPTED') {
    return (
      <p className="mt-6 rounded-lg bg-field-600/10 px-4 py-3 text-center text-sm font-semibold text-field-600">
        참여 확정됐어요. 작성자와 DM으로 약속을 조율해보세요.
      </p>
    );
  }

  if (myApplication?.status === 'REJECTED') {
    return (
      <p className="mt-6 rounded-lg bg-ink-900/5 px-4 py-3 text-center text-sm text-ink-900/50">
        신청이 거절되었습니다.
      </p>
    );
  }

  if (myApplication?.status === 'PENDING') {
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
          onClick={handleCancel}
          disabled={submitting}
          className="w-full rounded-lg border border-ink-900/15 py-2.5 text-sm font-semibold text-ink-900/70 transition hover:border-ink-900/30 disabled:opacity-50"
        >
          {submitting ? '취소하는 중...' : '신청 취소'}
        </button>
      </div>
    );
  }

  if (postStatus === 'MATCHED' || postStatus === 'CLOSED') {
    return (
      <p className="mt-6 rounded-lg bg-ink-900/5 px-4 py-3 text-center text-sm text-ink-900/50">
        {postStatus === 'MATCHED' ? '이미 모집 정원이 찼어요.' : '마감된 모집글이에요.'}
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="mt-6 w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400"
      >
        신청하기
      </button>
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

      {showForm ? (
        <form onSubmit={handleApply} className="space-y-3">
          <textarea
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="작성자에게 한마디 남겨보세요 (선택)"
            className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-ink-900/15 py-2.5 text-sm font-medium text-ink-900/60 transition hover:border-ink-900/30"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
            >
              {submitting ? '신청 중...' : '신청 보내기'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400"
        >
          신청하기
        </button>
      )}
    </div>
  );
}
