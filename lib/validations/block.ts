import { z } from 'zod';

export const createBlockSchema = z.object({
  blockedId: z.string().trim().min(1, '차단 대상을 선택해주세요.'),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
