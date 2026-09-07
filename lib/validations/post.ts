import { z } from 'zod';

export const listPostsQuerySchema = z.object({
  status: z.enum(['OPEN', 'MATCHED', 'CLOSED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(['latest', 'matchDate', 'deadline']).default('latest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createPostSchema = z.object({
  teamId: z.number().int().positive(),
  title: z.string().trim().min(1, '제목을 입력해주세요.'),
  content: z.string().trim().min(1, '내용을 입력해주세요.'),
  matchDate: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now(), '경기 날짜는 미래 날짜여야 합니다.'),
  opponent: z.string().trim().min(1).optional(),
  stadiumZone: z.string().trim().min(1).optional(),
  capacity: z.number().int().min(2, '모집 인원은 2명 이상이어야 합니다.').default(2),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
