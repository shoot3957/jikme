'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doHyeon, plexSansKr } from '@/lib/fonts';

type RoomItem = {
  roomId: string;
  otherUser: { id: string; nickname: string; image: string | null } | null;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
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

export default function DmListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomItem[]>([]);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/rooms');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setRooms(data.items ?? []);
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
        <h1 className="text-2xl font-bold text-ink-900">채팅</h1>
        <p className="mt-1 text-sm text-ink-900/60">메이트와 나눈 대화를 확인하세요.</p>

        {rooms.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-ink-900/15 px-6 py-16 text-center text-sm text-ink-900/40">
            아직 대화중인 채팅방이 없어요.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {rooms.map((room) => (
              <li key={room.roomId}>
                <Link
                  href={`/dm/${room.roomId}`}
                  className="flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white px-5 py-4 transition hover:border-ink-900/25 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-sm font-semibold text-ink-900">
                    {room.otherUser?.nickname.slice(0, 1) ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {room.otherUser?.nickname ?? '알 수 없는 사용자'}
                      </p>
                      {room.lastMessage && (
                        <span className="shrink-0 text-xs text-ink-900/40">
                          {formatRelativeTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-900/50">
                      {room.lastMessage?.content ?? '아직 메시지가 없어요.'}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-stitch-600 px-1.5 text-xs font-semibold text-white">
                      {room.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
