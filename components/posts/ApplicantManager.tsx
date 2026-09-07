'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Applicant = {
  id: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  applicant: {
    id: string;
    nickname: string;
    watchCount: number;
    favoriteTeam: { name: string } | null;
  };
};

const STATUS_LABEL = { PENDING: '대기중', ACCEPTED: '수락됨', REJECTED: '거절됨' } as const;
const STATUS_BADGE = {
  PENDING: 'bg-gold-500/15 text-gold-600',
  ACCEPTED: 'bg-field-600/10 text-field-600',
  REJECTED: 'bg-ink-900/10 text-ink-900/40',
} as const;

export default function ApplicantManager({ applications }: { applications: Applicant[] }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleDecision(applicationId: string, status: 'ACCEPTED' | 'REJECTED') {
    setError('');
    setProcessingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? '처리에 실패했습니다.');
        return;
      }
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="mt-8 border-t border-ink-900/10 pt-6">
      <h2 className="text-sm font-semibold text-ink-900">
        신청자 목록{applications.length > 0 && ` (${applications.length})`}
      </h2>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
        >
          {error}
        </p>
      )}

      {applications.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-ink-900/15 px-6 py-10 text-center text-sm text-ink-900/40">
          아직 신청자가 없어요.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {applications.map((app) => (
            <li key={app.id} className="rounded-xl border border-ink-900/10 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{app.applicant.nickname}</p>
                  <p className="mt-0.5 text-xs text-ink-900/50">
                    {app.applicant.favoriteTeam ? `${app.applicant.favoriteTeam.name} 팬` : '응원팀 미설정'} · 직관{' '}
                    {app.applicant.watchCount}회
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[app.status]}`}
                >
                  {STATUS_LABEL[app.status]}
                </span>
              </div>

              {app.message && <p className="mt-2 text-sm text-ink-900/70">&ldquo;{app.message}&rdquo;</p>}

              {app.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={processingId === app.id}
                    onClick={() => handleDecision(app.id, 'ACCEPTED')}
                    className="rounded-lg bg-field-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-field-700 disabled:opacity-50"
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    disabled={processingId === app.id}
                    onClick={() => handleDecision(app.id, 'REJECTED')}
                    className="rounded-lg border border-ink-900/15 px-4 py-1.5 text-xs font-semibold text-ink-900/70 transition hover:border-ink-900/30 disabled:opacity-50"
                  >
                    거절
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
