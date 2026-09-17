'use client';

import type { Tag } from '@/lib/useTeamsAndTags';

const MAX_TAGS = 5;

export default function TagPicker({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: number[];
  onChange: (tagIds: number[]) => void;
}) {
  function toggleTag(tagId: number) {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
      return;
    }
    if (value.length >= MAX_TAGS) return;
    onChange([...value, tagId]);
  }

  return (
    <div>
      <p className="mb-3 text-xs text-ink-900/50">최대 5개까지 고를 수 있어요. ({value.length}/5)</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = value.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? 'border-gold-500 bg-gold-500 text-ink-900'
                  : 'border-ink-900/15 text-ink-900/70 hover:border-ink-900/30'
              }`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
