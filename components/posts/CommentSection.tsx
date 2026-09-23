'use client';

import { useState } from 'react';
import Link from 'next/link';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; nickname: string };
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

  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso))
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

export default function CommentSection({
  commentsEndpoint,
  deleteEndpointBase,
  initialComments,
  currentUserId,
}: {
  /** 댓글 목록 조회(GET)/작성(POST) 엔드포인트, 예: `/api/posts/${postId}/comments` */
  commentsEndpoint: string;
  /** 댓글 삭제(DELETE) 엔드포인트의 베이스, 예: `/api/comments` → `${deleteEndpointBase}/${commentId}` */
  deleteEndpointBase: string;
  initialComments: Comment[];
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(commentsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.status === 201) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setContent('');
        return;
      }

      const data = await res.json().catch(() => null);
      setError(data?.errors?.[0] ?? data?.error ?? '댓글 등록에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('댓글을 삭제할까요?')) return;

    setError('');
    setDeletingId(commentId);
    try {
      const res = await fetch(`${deleteEndpointBase}/${commentId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? '삭제에 실패했습니다.');
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-10 border-t border-ink-900/10 pt-6">
      <h2 className="text-sm font-semibold text-ink-900">
        댓글{comments.length > 0 && ` (${comments.length})`}
      </h2>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
        >
          {error}
        </p>
      )}

      {comments.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-ink-900/15 px-6 py-10 text-center text-sm text-ink-900/40">
          아직 댓글이 없어요. 가볍게 질문을 남겨보세요.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ink-900/10">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 py-4 first:pt-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-xs font-semibold text-ink-900">
                {comment.author.nickname.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-900">{comment.author.nickname}</span>
                    <span className="text-xs text-ink-900/40">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  {currentUserId === comment.author.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="shrink-0 text-xs text-stitch-600 transition hover:underline disabled:opacity-50"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-900/80">{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        {currentUserId ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={content}
              maxLength={500}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 남겨보세요"
              className="min-w-0 flex-1 rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="shrink-0 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </form>
        ) : (
          <p className="rounded-lg bg-ink-900/5 px-4 py-3 text-center text-sm text-ink-900/50">
            댓글을 쓰려면{' '}
            <Link href="/login" className="font-medium text-stitch-600 hover:underline">
              로그인
            </Link>
            하세요.
          </p>
        )}
      </div>
    </div>
  );
}
