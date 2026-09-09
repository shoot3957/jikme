import { z } from 'zod';

export const createReportSchema = z.object({
  targetUserId: z.string().trim().min(1, '신고 대상을 선택해주세요.'),
  reason: z.string().trim().min(1, '신고 사유를 입력해주세요.').max(500, '신고 사유는 500자 이내로 입력해주세요.'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
