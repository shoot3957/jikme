import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });
  return NextResponse.json(tags);
}
