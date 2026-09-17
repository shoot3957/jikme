'use client';

const MAX_LENGTH = 50;

export default function BioInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <textarea
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder ?? '예: 3루 익사이팅존에서 목청껏 응원하는 걸 좋아해요'}
        className="w-full resize-none rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
      <p className="mt-1.5 text-right text-xs text-ink-900/40">
        {value.length}/{MAX_LENGTH}
      </p>
    </div>
  );
}
