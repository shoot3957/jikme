# 직메 (jikme) 프로젝트 가이드

Claude Code가 이 프로젝트에서 작업할 때 참고하는 컨텍스트입니다.

## 개요
야구 직관 메이트를 구하는 웹 서비스. 구단별 게시판 + 모집글(신청/수락 승인제) + DM 실시간 채팅.

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Supabase/Neon)
- NextAuth (이메일 Credentials + 카카오 OAuth)
- Socket.io — Next.js 앱과 분리된 별도 서버(`server/socket-server.ts`)로 DM 실시간 채팅만 담당. Vercel 서버리스는 상시 WebSocket을 지원하지 않기 때문.

## 문서
- `docs/spec.md` — 기능 명세, DB 설계 근거, MVP 범위
- `docs/api.md` — API 엔드포인트 설계
- `prisma/schema.prisma` — 실제 DB 스키마 (원본 소스, spec.md는 이걸 기획 관점에서 설명한 것)

## 핵심 설계 결정 (변경 시 docs/spec.md도 같이 업데이트할 것)
- 모집 인원 마감: 신청→수락 승인제 (`Application` 모델, PENDING/ACCEPTED/REJECTED)
- 직관 횟수: 자동 집계. 작성자가 `Post.complete` 액션 실행 시 작성자+ACCEPTED 신청자 전원 `watchCount` +1
- 채팅 메시지 보관: 나간 사람 화면에서만 숨김 (`RoomParticipant.leftAt`), 상대방 화면엔 유지, DB에서 삭제 안 함
- 신고/차단 기능은 v1에 포함 (`Report`, `Block` 모델)
- 이메일 인증은 v2로 미룸

## 코딩 컨벤션
- 서버 컴포넌트가 기본값. 상호작용(폼, 클릭 등)이 필요한 컴포넌트만 `'use client'`
- API Route Handler는 `docs/api.md`의 경로/메서드/요청·응답 스펙을 따름
- DB 접근은 `lib/prisma.ts`의 싱글톤 클라이언트를 통해서만
- 유효성 검증은 zod 사용
