import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '직메 | 야구 직관 메이트',
  description: '같은 팀을 응원하는 직관 메이트를 찾아보세요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
