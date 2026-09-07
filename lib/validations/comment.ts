import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(500, '댓글은 500자 이내로 입력해주세요.'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
