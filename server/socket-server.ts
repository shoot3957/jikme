/**
 * ⚠️ 중요: Vercel의 서버리스 함수는 지속적인 WebSocket 연결을 지원하지 않습니다.
 * 따라서 Socket.io 서버는 Next.js 앱(Vercel)과 분리된 별도 Node 서버로 구동해야 합니다.
 *
 * 배포 옵션:
 *  1) Railway / Render / Fly.io 등에 이 서버만 별도로 배포 (권장, 무료 티어 존재)
 *  2) Supabase Realtime으로 대체 (Postgres 기반, DB와 통합 관리 편함, Socket.io 불필요)
 *
 * 로컬 개발: `npm run socket` 으로 실행 (기본 포트 4000)
 */
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on(
    'send-message',
    async (payload: { roomId: string; senderId: string; content: string }) => {
      const message = await prisma.message.create({
        data: {
          roomId: payload.roomId,
          senderId: payload.senderId,
          content: payload.content,
        },
      });
      io.to(payload.roomId).emit('new-message', message);
    }
  );

  socket.on('disconnect', () => {
    // 필요 시 접속 종료 처리
  });
});

const PORT = process.env.SOCKET_PORT ?? 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io 서버 실행 중: http://localhost:${PORT}`);
});
