import { z } from 'zod';

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2~12자로 입력해주세요.')
    .max(12, '닉네임은 2~12자로 입력해주세요.')
    .optional(),
  image: z.string().trim().url('올바른 이미지 URL이 아닙니다.').optional(),
  bio: z.string().trim().max(50, '한줄 소개는 50자 이내로 입력해주세요.').optional(),
  favoriteTeamId: z.number().int().positive().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const tagIdsSchema = z.object({
  tagIds: z.array(z.number().int().positive()).max(5, '태그는 최대 5개까지 선택할 수 있습니다.'),
});
