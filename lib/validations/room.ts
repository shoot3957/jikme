import { z } from 'zod';

export const createRoomSchema = z.object({
  targetUserId: z.string().trim().min(1, '대화 상대를 선택해주세요.'),
});

export const listMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
