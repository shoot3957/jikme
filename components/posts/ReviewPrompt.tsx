'use client';

import { useEffect, useState } from 'react';
import { POSITIVE_TAGS, NEGATIVE_TAGS } from '@/lib/reviewTags';

type Reviewable = { id: string; nickname: string; image: string | null };
type ReviewType = 'POSITIVE' | 'NEGATIVE';

export default function ReviewPrompt({ postId }: { postId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [people, setPeople] = useState<Reviewable[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [type, setType] = useState<ReviewType>('POSITIVE');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${postId}/reviewable`);
        if (res.ok) {
          const data = await res.json();
          setPeople(data.items ?? []);
        }
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [postId]);

  function openFor(personId: string) {
    setActiveId(personId);
    setType('POSITIVE');
    setSelectedTags([]);
    setComment('');
    setError('');
  }

  function switchType(next: ReviewType) {
    setType(next);
    setSelectedTags([]);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit(revieweeId: string) {
    if (selectedTags.length === 0) {
      setError('태그를 1개 이상 선택해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revieweeId, type, tags: selectedTags, comment: comment.trim() || undefined }),
      });
      if (res.status === 201) {
        setPeople((prev) => prev.filter((p) => p.id !== revieweeId));
        setActiveId(null);
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.errors?.[0] ?? data?.error ?? '후기 등록에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded || people.length === 0) return null;

  const tagOptions = type === 'POSITIVE' ? POSITIVE_TAGS : NEGATIVE_TAGS;

  return (
    <div className="mt-6 rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
      <h2 className="text-sm font-semibold text-ink-900">함께한 메이트에게 후기 남기기</h2>
      <p className="mt-1 text-xs text-ink-900/50">서로의 매너온도에 반영돼요. 누가 남겼는지는 표시되지 않아요.</p>

      <ul className="mt-4 space-y-3">
        {people.map((person) => (
          <li key={person.id} className="rounded-lg border border-ink-900/10 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-900/5 text-xs font-semibold text-ink-900">
                  {person.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.image} alt={person.nickname} className="h-full w-full object-cover" />
                  ) : (
                    person.nickname.slice(0, 1)
                  )}
                </div>
                <span className="text-sm font-medium text-ink-900">{person.nickname}</span>
              </div>
              {activeId !== person.id && (
                <button
                  type="button"
                  onClick={() => openFor(person.id)}
                  className="shrink-0 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-ink-900 transition hover:bg-gold-400"
                >
                  후기 남기기
                </button>
              )}
            </div>

            {activeId === person.id && (
              <div className="mt-4 space-y-3 border-t border-ink-900/10 pt-4">
                {error && <p className="text-xs text-stitch-600">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => switchType('POSITIVE')}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                      type === 'POSITIVE'
                        ? 'border-field-600 bg-field-600/10 text-field-600'
                        : 'border-ink-900/15 text-ink-900/60 hover:border-ink-900/30'
                    }`}
                  >
                    좋아요
                  </button>
                  <button
                    type="button"
                    onClick={() => switchType('NEGATIVE')}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                      type === 'NEGATIVE'
                        ? 'border-stitch-600 bg-stitch-600/10 text-stitch-600'
                        : 'border-ink-900/15 text-ink-900/60 hover:border-ink-900/30'
                    }`}
                  >
                    아쉬워요
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => {
                    const selected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          selected
                            ? type === 'POSITIVE'
                              ? 'border-field-600 bg-field-600 text-white'
                              : 'border-stitch-600 bg-stitch-600 text-white'
                            : 'border-ink-900/15 text-ink-900/60 hover:border-ink-900/30'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={comment}
                  maxLength={200}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="한마디 남겨보세요 (선택)"
                  className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="flex-1 rounded-lg border border-ink-900/15 py-2 text-sm font-medium text-ink-900/60 transition hover:border-ink-900/30"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(person.id)}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
                  >
                    {submitting ? '등록 중...' : '후기 등록'}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
