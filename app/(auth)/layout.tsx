import Link from 'next/link';
import { doHyeon, plexSansKr } from '@/lib/fonts';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${doHyeon.variable} ${plexSansKr.variable} font-body grid min-h-screen lg:grid-cols-2`}>
      {/* 야간 스타디움 히어로 패널 */}
      <div className="relative flex h-64 flex-col justify-between overflow-hidden bg-ink-900 px-8 py-10 text-chalk-50 lg:h-auto lg:justify-center lg:px-16 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-500/30 blur-3xl animate-glow motion-reduce:animate-none"
        />
        <svg
          aria-hidden
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 left-0 h-20 w-full opacity-30 lg:h-28 lg:opacity-40"
        >
          <path
            d="M -20 60 Q 100 15 200 60 T 420 60"
            fill="none"
            stroke="#C23B3B"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10">
          <Link href="/" className="font-display inline-block text-4xl tracking-tight lg:text-6xl">
            직메
          </Link>
          <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-chalk-50/80 lg:mt-6 lg:text-base">
            같은 팀을 응원하는 직관 메이트를 찾아보세요. 3루 응원석에서 혼자 응원하지 마세요.
          </p>
        </div>

        <div className="relative z-10 mt-10 hidden text-xs text-chalk-50/50 lg:block">
          ⚾ KBO 10구단 누구나
        </div>
      </div>

      {/* 폼 패널 */}
      <main className="flex items-center justify-center bg-chalk-50 px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
