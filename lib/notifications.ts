import type { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

async function pushRealtimeEvent(userId: string, event: string, payload: unknown) {
  const secret = process.env.SOCKET_INTERNAL_SECRET;
  if (!secret) return;

  const socketUrl = process.env.SOCKET_SERVER_INTERNAL_URL ?? 'http://localhost:4000';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    await fetch(`${socketUrl}/internal/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ userId, event, payload }),
      signal: controller.signal,
    });
  } catch {
    // 소켓 서버가 꺼져있거나 응답이 없어도 알림은 이미 DB에 저장되었으므로 무시하고 계속 진행 (best-effort push)
  } finally {
    clearTimeout(timeout);
  }
}

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
  const notification = await prisma.notification.create({
    data: { userId, type, message, link },
  });

  await pushRealtimeEvent(userId, 'notification', notification);

  return notification;
}
