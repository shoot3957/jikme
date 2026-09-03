import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2~12자로 입력해주세요.')
    .max(12, '닉네임은 2~12자로 입력해주세요.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const nicknameQuerySchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2~12자로 입력해주세요.')
    .max(12, '닉네임은 2~12자로 입력해주세요.'),
});
