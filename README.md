# 직메 (jikme) ⚾

야구 직관 메이트를 구하는 웹 서비스 — 소개팅앱 + 당근마켓 느낌

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Socket.io (DM 실시간 채팅, 별도 서버로 분리 배포)
- 배포: Vercel(웹) + Supabase 또는 Neon(DB, 무료)
- 도메인: koodev.store (가비아)

## 시작하기

```bash
npm install
cp .env.example .env   # 값 채우기 (DATABASE_URL, KAKAO_CLIENT_ID 등)

npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed      # 10개 구단 시드 데이터 삽입

npm run dev              # http://localhost:3000
npm run socket            # (별도 터미널) 소켓 서버 http://localhost:4000
```

## 아키텍처 메모 — DM 채팅

Vercel 서버리스 함수는 지속적인 WebSocket 연결을 지원하지 않습니다.
그래서 `server/socket-server.ts`는 Next.js 앱과 완전히 분리된 Node 프로세스입니다.

- **로컬**: `npm run socket`으로 별도 실행
- **배포**: Railway / Render / Fly.io 등 상시 구동 가능한 호스트에 별도 배포 권장 (모두 무료 티어 있음)
- **대안**: Supabase를 DB로 쓴다면 Supabase Realtime으로 대체해 Socket.io 없이 구현하는 것도 가능 — 인프라를 하나로 통합할 수 있어 장기적으로 더 단순함

## 폴더 구조

```
app/
  (auth)/login, (auth)/register   # 로그인/회원가입
  teams/[teamId]                  # 구단별 게시판
  posts/[postId]/new              # 직관 메이트 모집글 작성
  dm/[roomId]                     # 1:1 채팅방
  profile                         # 프로필
  api/auth/[...nextauth]          # NextAuth 라우트
lib/
  prisma.ts                       # Prisma client 싱글톤
  auth.ts                         # NextAuth 설정 (이메일 + 카카오)
prisma/
  schema.prisma                   # User, Team, Post, Comment, Room, Message, Notification 등
  seed.ts                         # 10개 구단 시드
server/
  socket-server.ts                # 독립 Socket.io 서버
```

## 다음 단계 제안

1. `npx create-next-app`으로 실제 프로젝트를 만들거나, 이 스캐폴드를 그대로 기반 삼아 `npm install` 진행
2. Supabase/Neon 프로젝트 생성 → `DATABASE_URL` 연결 → `prisma migrate dev`
3. Kakao Developers에서 앱 등록 → REST API 키, Redirect URI 설정 (`/api/auth/callback/kakao`)
4. 로그인 페이지(`app/(auth)/login`)부터 UI 구현 시작
5. 구단별 게시판(`app/teams/[teamId]`) → 모집글 상세/작성 → DM 순으로 확장
