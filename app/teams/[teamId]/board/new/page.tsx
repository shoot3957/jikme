'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import MultiImageUploader from '@/components/MultiImageUploader';

export default function NewBoardPostPage({ params }: { params: { teamId: string } }) {
  const router = useRouter();
  const { teamId } = params;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/users/me');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, images }),
      });
      if (res.status === 201) {
        const post = await res.json();
        router.push(`/board/${post.id}`);
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.errors?.[0] ?? data?.error ?? '게시글 등록에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk-50">
        <p className="text-sm text-ink-900/50">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body min-h-screen bg-chalk-50 px-6 py-12`}>
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-bold text-ink-900">글쓰기</h1>
        <p className="mt-1 text-sm text-ink-900/60">자유롭게 이야기를 나눠보세요.</p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-md border-l-4 border-stitch-600 bg-stitch-600/5 px-4 py-3 text-sm text-ink-900"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">제목</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">내용</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="자유롭게 작성해주세요"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900/80">사진 (선택)</label>
            <MultiImageUploader images={images} onChange={setImages} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </form>
      </div>
    </div>
  );
}
