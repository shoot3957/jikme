import type { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function createNotification({
  userId,
  type,
  message,
  link,
}: {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, message, link },
  });
}
