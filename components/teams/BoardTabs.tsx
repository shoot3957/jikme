import Link from 'next/link';

export default function BoardTabs({
  teamShortCode,
  active,
}: {
  teamShortCode: string;
  active: 'posts' | 'board';
}) {
  const tabs = [
    { key: 'posts', label: '모집글', href: `/teams/${teamShortCode}` },
    { key: 'board', label: '자유게시판', href: `/teams/${teamShortCode}/board` },
  ] as const;

  return (
    <div className="flex gap-1 border-b border-ink-900/10">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`relative px-3 py-2.5 text-sm font-medium transition ${
            active === tab.key ? 'text-ink-900' : 'text-ink-900/45 hover:text-ink-900/70'
          }`}
        >
          {tab.label}
          {active === tab.key && (
            <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold-500" />
          )}
        </Link>
      ))}
    </div>
  );
}
