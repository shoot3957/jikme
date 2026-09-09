'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportBlockMenu({
  targetUserId,
  currentUserId,
}: {
  targetUserId: string;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!currentUserId || currentUserId === targetUserId) return null;

  function openReport() {
    setMenuOpen(false);
    setError('');
    setReason('');
    setReportOpen(true);
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, reason: reason.trim() }),
      });
      if (res.status === 201) {
        setReportOpen(false);
        setNotice('신고가 접수되었습니다.');
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.errors?.[0] ?? data?.error ?? '신고 접수에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBlock() {
    setMenuOpen(false);
    if (!window.confirm('이 유저를 차단할까요? 서로의 글과 활동이 보이지 않게 돼요.')) return;

    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: targetUserId }),
      });
      if (res.status === 201) {
        setNotice('차단했습니다.');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setNotice(data?.error ?? '차단에 실패했습니다.');
    } catch {
      setNotice('네트워크 오류가 발생했습니다.');
    }
  }

  return (
    <>
      <div ref={rootRef} className="relative inline-block">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="더 보기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-900/40 transition hover:bg-ink-900/5 hover:text-ink-900/70"
        >
          ···
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-ink-900/10 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={openReport}
              className="block w-full px-3 py-2 text-left text-sm text-ink-900/70 transition hover:bg-ink-900/5"
            >
              신고하기
            </button>
            <button
              type="button"
              onClick={handleBlock}
              className="block w-full px-3 py-2 text-left text-sm text-stitch-600 transition hover:bg-stitch-600/5"
            >
              차단하기
            </button>
          </div>
        )}

        {notice && (
          <p className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-ink-900 px-2.5 py-1.5 text-xs text-white shadow">
            {notice}
          </p>
        )}
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
          onClick={() => setReportOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-semibold text-ink-900">신고하기</h3>
            <p className="mt-1 text-sm text-ink-900/50">어떤 문제가 있었는지 알려주세요.</p>

            <form onSubmit={submitReport} className="mt-4 space-y-3">
              {error && (
                <p
                  role="alert"
                  className="rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
                >
                  {error}
                </p>
              )}

              <textarea
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                autoFocus
                placeholder="신고 사유를 입력해주세요"
                className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="flex-1 rounded-lg border border-ink-900/15 py-2.5 text-sm font-medium text-ink-900/60 transition hover:border-ink-900/30"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="flex-1 rounded-lg bg-stitch-600 py-2.5 text-sm font-semibold text-white transition hover:bg-stitch-500 disabled:opacity-50"
                >
                  {submitting ? '접수 중...' : '신고하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
