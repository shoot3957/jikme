'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DmButton({
  targetUserId,
  label = 'DM 보내기',
  className,
}: {
  targetUserId: string;
  label?: string;
  className: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        router.push(`/dm/${data.roomId}`);
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'DM 방 생성에 실패했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? '연결 중...' : label}
      </button>
      {error && <p className="text-xs text-stitch-600">{error}</p>}
    </div>
  );
}
