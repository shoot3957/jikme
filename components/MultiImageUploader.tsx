'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';

const MAX_IMAGES = 5;

export default function MultiImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  // ImageUploader는 "현재 슬롯 하나"를 다루는 컴포넌트라, 업로드가 끝날 때마다
  // key를 바꿔 새 인스턴스로 리마운트시켜서 빈 상태의 "다음 장 추가" 슬롯을 만든다.
  const [uploaderKey, setUploaderKey] = useState(0);

  function handleUploaded(url: string) {
    onChange([...images, url]);
    setUploaderKey((k) => k + 1);
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div
            key={url}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ink-900/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`첨부 이미지 ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label="이미지 삭제"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/70 text-xs leading-none text-white transition hover:bg-stitch-600"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <ImageUploader
            key={uploaderKey}
            onUploaded={handleUploaded}
            shape="square"
            label="사진 추가"
            className="h-24 w-24 shrink-0"
          />
        )}
      </div>

      <p className="mt-2 text-xs text-ink-900/40">
        {images.length}/{MAX_IMAGES}장
      </p>
    </div>
  );
}
