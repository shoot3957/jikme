'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import { doHyeon, plexSansKr } from '@/lib/fonts';

type Message = {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

type OtherUser = { id: string; nickname: string; image: string | null };

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const { roomId } = params;
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [leaving, setLeaving] = useState(false);

  function markRead() {
    fetch(`/api/rooms/${roomId}/read`, { method: 'PATCH' })
      .then((res) => {
        if (res.ok) {
          // Header의 DM 안읽음 배지는 이 페이지와 별개 컴포넌트라 상태를 공유하지 않으므로,
          // 커스텀 이벤트로 "다시 조회해서 정확히 맞춰라"고 알려준다.
          window.dispatchEvent(new CustomEvent('dm-read'));
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const meRes = await fetch('/api/users/me');
      if (meRes.status === 401) {
        router.replace('/login');
        return;
      }
      const me = await meRes.json();
      if (cancelled) return;
      currentUserIdRef.current = me.id;
      setCurrentUserId(me.id);

      const msgRes = await fetch(`/api/rooms/${roomId}/messages`);
      if (msgRes.status === 403 || msgRes.status === 404) {
        const data = await msgRes.json().catch(() => null);
        setAccessError(data?.error ?? '채팅방에 접근할 수 없어요.');
        setLoading(false);
        return;
      }
      const data = await msgRes.json();
      if (cancelled) return;
      setMessages(data.items ?? []);
      setOtherUser(data.otherUser ?? null);
      setLoading(false);

      markRead();

      const socket = io(SOCKET_URL, { withCredentials: true });
      socketRef.current = socket;
      socket.emit('join-room', roomId);
      socket.on('new-message', (message: Message) => {
        if (message.roomId !== roomId) return;
        setMessages((prev) => [...prev, message]);
        if (message.senderId !== currentUserIdRef.current) {
          markRead();
        }
      });
    }

    init();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !currentUserId || !socketRef.current) return;
    socketRef.current.emit('send-message', { roomId, senderId: currentUserId, content: trimmed });
    setContent('');
  }

  async function handleLeave() {
    if (!window.confirm('채팅방을 나가시겠어요? 나간 이후의 대화 내용은 다시 보이지 않아요.')) return;
    setLeaving(true);
    try {
      await fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' });
      router.push('/dm');
    } catch {
      setLeaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk-50">
        <p className="text-sm text-ink-900/50">불러오는 중...</p>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body flex min-h-screen flex-col items-center justify-center gap-4 bg-chalk-50 px-6`}>
        <p className="text-sm text-ink-900/50">{accessError}</p>
        <Link href="/dm" className="text-sm font-medium text-stitch-600 hover:underline">
          채팅 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body flex h-screen flex-col bg-chalk-50`}>
      <header className="flex items-center justify-between border-b border-ink-900/10 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dm" className="text-sm text-ink-900/50 hover:text-ink-900">
            ← 목록
          </Link>
          <span className="text-sm font-semibold text-ink-900">{otherUser?.nickname ?? '알 수 없는 사용자'}</span>
        </div>
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="text-xs font-medium text-stitch-600 transition hover:underline disabled:opacity-50"
        >
          나가기
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-900/40">
            {otherUser?.nickname ?? '메이트'}님과의 대화를 시작해보세요.
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((message) => {
              const isMine = message.senderId === currentUserId;
              return (
                <li key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[75%] items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                        isMine
                          ? 'rounded-br-sm bg-gold-500 text-ink-900'
                          : 'rounded-bl-sm border border-ink-900/10 bg-white text-ink-900'
                      }`}
                    >
                      {message.content}
                    </div>
                    <span className="shrink-0 pb-0.5 text-[10px] text-ink-900/35">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-ink-900/10 bg-white px-6 py-4">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="min-w-0 flex-1 rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="shrink-0 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
