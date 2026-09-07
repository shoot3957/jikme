import { z } from 'zod';

export const createApplicationSchema = z.object({
  message: z.string().trim().max(200, '한마디는 200자 이내로 입력해주세요.').optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
