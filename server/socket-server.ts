/**
 * ⚠️ 중요: Vercel의 서버리스 함수는 지속적인 WebSocket 연결을 지원하지 않습니다.
 * 따라서 Socket.io 서버는 Next.js 앱(Vercel)과 분리된 별도 Node 서버로 구동해야 합니다.
 *
 * 배포 옵션:
 *  1) Railway / Render / Fly.io 등에 이 서버만 별도로 배포 (권장, 무료 티어 존재)
 *  2) Supabase Realtime으로 대체 (Postgres 기반, DB와 통합 관리 편함, Socket.io 불필요)
 *
 * 로컬 개발: `npm run socket` 으로 실행 (기본 포트 4000)
 *
 * 배포 시 필요한 환경변수:
 *  - PORT: Railway 등 PaaS가 자동 주입 (없으면 SOCKET_PORT, 그것도 없으면 4000)
 *  - ALLOWED_ORIGINS: 허용할 프론트엔드 origin, 콤마로 여러 개 지정 가능
 *    (예: "http://localhost:3000,https://jikme.vercel.app")
 *  - SOCKET_INTERNAL_SECRET: Next.js 서버 -> 이 서버 POST /internal/notify 인증용 공유 비밀값
 *  - DATABASE_URL / DIRECT_URL: Next.js 앱과 동일한 Postgres 연결 정보
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

// 특정 유저에게 실시간 이벤트를 보내기 위한 개인 room 이름
function userRoom(userId: string) {
  return `user:${userId}`;
}

// Next.js 서버(별도 프로세스)가 DB 변경 후 이 소켓 서버에 실시간 push를 위임하는 내부 엔드포인트.
// socket.io가 처리하지 않는 경로(/socket.io/ 이외)는 이 리스너로 그대로 전달된다.
async function handleInternalNotify(req: IncomingMessage, res: ServerResponse, io: Server) {
  const secret = req.headers['x-internal-secret'];
  if (!process.env.SOCKET_INTERNAL_SECRET || secret !== process.env.SOCKET_INTERNAL_SECRET) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    try {
      const { userId, event, payload } = JSON.parse(body || '{}');
      if (!userId || !event) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'userId and event are required' }));
        return;
      }

      io.to(userRoom(userId)).emit(event, payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid JSON body' }));
    }
  });
}

// ALLOWED_ORIGINS="http://localhost:3000,https://jikme.vercel.app" 형태의 콤마 구분 목록을 파싱.
// 지정하지 않으면 기존 NEXT_PUBLIC_APP_URL(단일 origin) 또는 로컬 기본값으로 대체한다.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const httpServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/internal/notify') {
    handleInternalNotify(req, res, io);
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('identify', (userId: string) => {
    if (typeof userId === 'string' && userId) {
      socket.join(userRoom(userId));
    }
  });

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on(
    'send-message',
    async (payload: { roomId: string; senderId: string; content: string }) => {
      if (!payload.content?.trim()) return;

      // 실제 이 방의 참여자가 보낸 메시지인지 검증 (참여자가 아니면 저장/전송하지 않음)
      const participant = await prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId: payload.roomId, userId: payload.senderId } },
      });
      if (!participant) {
        socket.emit('send-message-error', { error: '이 채팅방의 참여자가 아닙니다.' });
        return;
      }

      const otherParticipants = await prisma.roomParticipant.findMany({
        where: { roomId: payload.roomId, userId: { not: payload.senderId } },
        select: { userId: true, leftAt: true },
      });

      // 상대방이 방을 나간 상태(leftAt 설정됨)라면, 새 메시지가 도착하는 시점에 재입장시켜
      // REST(POST /api/rooms)로 재대화를 시작한 경우와 동일하게 목록/히스토리가 복구되도록 한다.
      const leftUserIds = otherParticipants.filter((p) => p.leftAt !== null).map((p) => p.userId);
      if (leftUserIds.length > 0) {
        await prisma.roomParticipant.updateMany({
          where: { roomId: payload.roomId, userId: { in: leftUserIds } },
          data: { leftAt: null },
        });
      }

      const message = await prisma.message.create({
        data: {
          roomId: payload.roomId,
          senderId: payload.senderId,
          content: payload.content,
        },
      });
      // message에는 id/roomId/senderId/content/createdAt/readAt이 모두 담겨 있어,
      // 클라이언트가 발신자 여부나 나간 시점(leftAt) 기준 필터링을 직접 판단할 수 있다.
      io.to(payload.roomId).emit('new-message', message);

      // 방 화면을 보고 있지 않은 수신자에게도 헤더 배지가 즉시 갱신되도록 개인 room으로 별도 push
      for (const other of otherParticipants) {
        io.to(userRoom(other.userId)).emit('dm-badge', {
          roomId: payload.roomId,
          senderId: payload.senderId,
        });
      }
    }
  );

  socket.on('disconnect', () => {
    // 필요 시 접속 종료 처리
  });
});

// Railway 등 PaaS는 자체적으로 PORT 환경변수를 주입하므로 그것을 최우선으로 사용한다.
const PORT = process.env.PORT ?? process.env.SOCKET_PORT ?? 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io 서버 실행 중: http://localhost:${PORT}`);
});
