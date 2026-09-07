'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doHyeon, plexSansKr } from '@/lib/fonts';

type MyApplicationItem = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  post: {
    id: string;
    title: string;
    matchDate: string;
    status: 'OPEN' | 'MATCHED' | 'CLOSED';
    team: { name: string; shortCode: string };
  };
};

const GROUPS = [
  { status: 'PENDING', label: '대기중' },
  { status: 'ACCEPTED', label: '수락됨' },
  { status: 'REJECTED', label: '거절됨' },
] as const;

const STATUS_BADGE = {
  PENDING: 'bg-gold-500/15 text-gold-600',
  ACCEPTED: 'bg-field-600/10 text-field-600',
  REJECTED: 'bg-ink-900/10 text-ink-900/40',
} as const;

function formatMatchDate(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<MyApplicationItem[]>([]);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/users/me/applications');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setApplications(data.items ?? []);
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk-50">
        <p className="text-sm text-ink-900/50">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12`}>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-ink-900">내 신청 현황</h1>
        <p className="mt-1 text-sm text-ink-900/60">신청한 모집글을 상태별로 모아봤어요.</p>

        {applications.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-ink-900/15 px-6 py-16 text-center text-sm text-ink-900/40">
            아직 신청한 모집글이 없어요.
          </p>
        ) : (
          <div className="mt-8 space-y-8">
            {GROUPS.map((group) => {
              const items = applications.filter((app) => app.status === group.status);
              if (items.length === 0) return null;

              return (
                <section key={group.status}>
                  <h2 className="text-sm font-semibold text-ink-900">
                    {group.label} ({items.length})
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {items.map((app) => (
                      <li key={app.id}>
                        <Link
                          href={`/posts/${app.post.id}`}
                          className="block rounded-xl border border-ink-900/10 bg-white px-5 py-4 transition hover:border-ink-900/25 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold text-ink-900">{app.post.title}</h3>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[app.status]}`}
                            >
                              {group.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-ink-900/60">
                            {app.post.team.name} · {formatMatchDate(app.post.matchDate)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
