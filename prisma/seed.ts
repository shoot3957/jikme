import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const teams = [
  { name: '두산 베어스', shortCode: 'doosan' },
  { name: 'LG 트윈스', shortCode: 'lg' },
  { name: 'KT 위즈', shortCode: 'kt' },
  { name: '삼성 라이온즈', shortCode: 'samsung' },
  { name: '롯데 자이언츠', shortCode: 'lotte' },
  { name: '한화 이글스', shortCode: 'hanwha' },
  { name: 'KIA 타이거즈', shortCode: 'kia' },
  { name: 'SSG 랜더스', shortCode: 'ssg' },
  { name: 'NC 다이노스', shortCode: 'nc' },
  { name: '키움 히어로즈', shortCode: 'kiwoom' },
];

const tags = [
  '직관 초보',
  '조용히 관람',
  '포토그래퍼',
  '먹으러 감',
  '열정 응원단',
  '사진 찍는 거 좋아함',
  '치킨파',
  '짠물 응원러',
];

async function main() {
  for (const team of teams) {
    await prisma.team.upsert({
      where: { shortCode: team.shortCode },
      update: {},
      create: team,
    });
  }
  console.log('10개 구단 시드 완료');

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('성향 태그 시드 완료');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
