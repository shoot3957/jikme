'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameStatus('idle');
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 12) {
      setNicknameStatus('invalid');
      return;
    }

    setNicknameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setNicknameStatus(data.available ? 'available' : 'taken');
      } catch {
        setNicknameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nickname]);

  const nicknameMessage = useMemo(() => {
    switch (nicknameStatus) {
      case 'checking':
        return { text: '확인 중...', className: 'text-ink-900/40' };
      case 'available':
        return { text: '사용 가능한 닉네임입니다.', className: 'text-field-600' };
      case 'taken':
        return { text: '이미 사용 중인 닉네임입니다.', className: 'text-stitch-600' };
      case 'invalid':
        return { text: '닉네임은 2~12자로 입력해주세요.', className: 'text-stitch-600' };
      default:
        return null;
    }
  }, [nicknameStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (nicknameStatus === 'taken' || nicknameStatus === 'invalid') {
      setError('닉네임을 확인해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      });

      if (res.status === 201) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (res.status === 409) {
        setError(data.error);
      } else if (res.status === 400) {
        setError(data.errors?.[0] ?? '입력값을 확인해주세요.');
      } else {
        setError('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">회원가입</h1>
      <p className="mt-1 text-sm text-ink-900/60">몇 가지만 알려주시면 바로 시작할 수 있어요.</p>

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
          <label className="mb-1 block text-sm font-medium text-ink-900/80">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="8자 이상"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">비밀번호 확인</label>
          <input
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900/80">닉네임</label>
          <input
            type="text"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg border border-ink-900/15 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="2~12자"
          />
          {nicknameMessage && (
            <p className={`mt-1.5 text-xs ${nicknameMessage.className}`}>{nicknameMessage.text}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-900/60">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-stitch-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
