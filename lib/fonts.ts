import { Do_Hyeon, IBM_Plex_Sans_KR } from 'next/font/google';

// 워드마크 전용 — 스코어보드 사인 느낌의 포스터형 디스플레이 서체. 한 곳에만 사용.
export const doHyeon = Do_Hyeon({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

// 본문/폼 전용 — 정갈한 그로테스크
export const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
