import type { Metadata } from 'next';
import './globals.css';
import { doHyeon, plexSansKr } from '@/lib/fonts';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: '직메 | 야구 직관 메이트',
  description: '같은 팀을 응원하는 직관 메이트를 찾아보세요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${doHyeon.variable} ${plexSansKr.variable} font-body`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
