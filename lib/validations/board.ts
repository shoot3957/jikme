import { z } from 'zod';

export const MAX_BOARD_IMAGES = 5;

export const createBoardPostSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
  content: z.string().trim().min(1, '내용을 입력해주세요.'),
  images: z
    .array(z.string().trim().url('올바른 이미지 URL이 아닙니다.'))
    .max(MAX_BOARD_IMAGES, `이미지는 최대 ${MAX_BOARD_IMAGES}장까지 첨부할 수 있습니다.`)
    .default([]),
});

export const updateBoardPostSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.').optional(),
  content: z.string().trim().min(1, '내용을 입력해주세요.').optional(),
  images: z
    .array(z.string().trim().url('올바른 이미지 URL이 아닙니다.'))
    .max(MAX_BOARD_IMAGES, `이미지는 최대 ${MAX_BOARD_IMAGES}장까지 첨부할 수 있습니다.`)
    .optional(),
});

export const listBoardPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateBoardPostInput = z.infer<typeof createBoardPostSchema>;
export type UpdateBoardPostInput = z.infer<typeof updateBoardPostSchema>;
