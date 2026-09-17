'use client';

import { useRef, useState } from 'react';

export default function ImageUploader({
  currentUrl,
  onUploaded,
  shape = 'square',
  label,
  className,
}: {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  shape?: 'circle' | 'square';
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (res.status === 201) {
        const data = await res.json();
        setPreview(data.url);
        onUploaded(data.url);
        return;
      }

      const data = await res.json().catch(() => null);
      setError(data?.error ?? '업로드에 실패했습니다.');
      setPreview(currentUrl ?? null);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`group relative block h-full w-full overflow-hidden border border-ink-900/10 bg-ink-900/5 ${shapeClass} disabled:opacity-70`}
      >
        {preview ? (
          // 업로드 직후 미리보기는 blob: URL, 이후엔 Supabase Storage의 원격 URL이라 next/image 대신 일반 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label ?? '이미지'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-ink-900/40">
            {label ?? '이미지 선택'}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-ink-900/40 group-hover:opacity-100">
          {uploading ? '업로드 중...' : '변경'}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="mt-1.5 text-xs text-stitch-600">{error}</p>}
    </div>
  );
}
