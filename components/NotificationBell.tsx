'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금 전';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;

  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

export default function NotificationBell({
  notifications,
  unreadCount,
  loaded,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[];
  unreadCount: number;
  loaded: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleReadAll() {
    onMarkAllRead();
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
    } catch {
      // 실패해도 다음 로드 시 서버 상태로 다시 맞춰짐
    }
  }

  async function handleClickNotification(notification: Notification) {
    if (!notification.isRead) {
      onMarkRead(notification.id);
      fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' }).catch(() => {});
    }
    setOpen(false);
    if (notification.link) router.push(notification.link);
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-900/60 transition hover:bg-ink-900/5 hover:text-ink-900"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-stitch-600" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-900/10 px-4 py-3">
            <span className="text-sm font-semibold text-ink-900">알림</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className="text-xs font-medium text-ink-900/50 transition hover:text-ink-900"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded ? (
              <p className="px-4 py-10 text-center text-sm text-ink-900/40">불러오는 중...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-900/40">새 알림이 없어요.</p>
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClickNotification(n)}
                      className={`block w-full px-4 py-3 text-left transition hover:bg-ink-900/5 ${
                        n.isRead ? '' : 'bg-gold-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />}
                        <div className={`min-w-0 ${n.isRead ? 'pl-3.5' : ''}`}>
                          <p className="text-sm leading-snug text-ink-900">{n.message}</p>
                          <p className="mt-1 text-xs text-ink-900/40">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
