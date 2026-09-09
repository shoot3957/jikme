import Link from 'next/link';
import { getCurrentUserId } from '@/lib/session';
import NotificationBell from '@/components/NotificationBell';

export default async function Header() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-chalk-50/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6 lg:px-16">
        <Link href="/" className="font-display text-lg text-ink-900">
          직메
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
