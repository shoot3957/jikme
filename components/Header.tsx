'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import NotificationBell, { type Notification } from '@/components/NotificationBell';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export default function Header({ userId }: { userId: string | null }) {
  const socketRef = useRef<Socket | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [profile, setProfile] = useState<{ nickname: string; image: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function refreshDmUnreadCount() {
      const res = await fetch('/api/rooms');
      if (cancelled || !res.ok) return;
      const data = await res.json();
      const total = (data.items ?? []).reduce(
        (sum: number, room: { unreadCount: number }) => sum + room.unreadCount,
        0
      );
      setUnreadDmCount(total);
    }

    async function loadInitialCounts() {
      const [notifRes, meRes] = await Promise.all([
        fetch('/api/notifications?limit=10'),
        fetch('/api/users/me'),
        refreshDmUnreadCount(),
      ]);
      if (cancelled) return;

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.items ?? []);
        setUnreadNotifCount(data.unreadCount ?? 0);
      }
      setNotifLoaded(true);

      if (meRes.ok) {
        const me = await meRes.json();
        setProfile({ nickname: me.nickname, image: me.image ?? null });
      }
    }
    loadInitialCounts();

    // dm/[roomId] 페이지는 별도 컴포넌트라 Header의 상태를 직접 갱신할 수 없으므로,
    // 읽음 처리가 끝나면 커스텀 이벤트로 알려주고 여기서 정확한 값을 다시 조회한다.
    function handleDmRead() {
      refreshDmUnreadCount();
    }
    window.addEventListener('dm-read', handleDmRead);

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('identify', userId);

    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotifCount((prev) => prev + 1);
    });

    socket.on('dm-badge', () => {
      setUnreadDmCount((prev) => prev + 1);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('dm-read', handleDmRead);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  if (!userId) return null;

  function markNotificationRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifCount(0);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-chalk-50/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6 lg:px-16">
        <Link href="/" className="font-display text-lg text-ink-900">
          직메
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/dm"
            aria-label="DM 목록"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-900/60 transition hover:bg-ink-900/5 hover:text-ink-900"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M4 5.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4.2 3.15A.5.5 0 0 1 3 20.25V6.5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            {unreadDmCount > 0 && (
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-stitch-600" />
            )}
          </Link>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadNotifCount}
            loaded={notifLoaded}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
          />
          <Link
            href="/profile"
            aria-label="내 프로필"
            className="ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-ink-900/10 bg-ink-900/5 text-xs font-semibold text-ink-900 transition hover:border-ink-900/25"
          >
            {profile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt={profile.nickname} className="h-full w-full object-cover" />
            ) : (
              profile?.nickname.slice(0, 1) ?? ''
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
