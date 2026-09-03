import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const teams = await prisma.team.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, shortCode: true },
  });
  return NextResponse.json(teams);
}
