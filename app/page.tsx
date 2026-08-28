import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function HomePage() {
  const teams = await prisma.team.findMany({ orderBy: { id: 'asc' } });

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">직메 ⚾ 직관 메이트 구하기</h1>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.shortCode}`}
            className="border rounded-xl p-4 text-center hover:shadow-md transition"
          >
            {team.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
