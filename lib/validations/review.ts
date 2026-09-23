import { z } from 'zod';
import { POSITIVE_TAGS, NEGATIVE_TAGS } from '@/lib/reviewTags';

export const createReviewSchema = z
  .object({
    revieweeId: z.string().trim().min(1, '후기 대상을 선택해주세요.'),
    type: z.enum(['POSITIVE', 'NEGATIVE']),
    tags: z
      .array(z.string())
      .min(1, '태그를 1개 이상 선택해주세요.')
      .max(5, '태그는 최대 5개까지 선택할 수 있습니다.'),
    comment: z.string().trim().max(200, '코멘트는 200자 이내로 입력해주세요.').optional(),
  })
  .superRefine((data, ctx) => {
    const allowed = data.type === 'POSITIVE' ? POSITIVE_TAGS : NEGATIVE_TAGS;
    if (data.tags.some((tag) => !allowed.includes(tag))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '선택한 태그가 올바르지 않습니다.', path: ['tags'] });
    }
  });

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
