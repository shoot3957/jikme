# 직메 API 엔드포인트 설계

모든 엔드포인트는 `app/api/` 하위 Route Handler로 구현. 인증이 필요한 엔드포인트는 NextAuth 세션(JWT) 기준으로 체크.
실시간 메시지 송수신 자체는 Socket.io가 담당하고, REST API는 초기 로드·생성·나가기 등 "상태 변경" 위주로 설계.

표기: 🔒 = 로그인 필요, 🔒✓작성자 = 로그인 + 본인(작성자/신청자) 확인 필요

---

## 1. 인증

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/auth/register` | - | 이메일 회원가입 (email, password, nickname) |
| GET/POST | `/api/auth/[...nextauth]` | - | NextAuth 표준 라우트 — 로그인/로그아웃/세션/카카오 콜백 전부 처리 |
| GET | `/api/auth/check-nickname` | - | 닉네임 중복 확인 `?nickname=` |

**POST /api/auth/register**
```json
// Request
{ "email": "a@a.com", "password": "pw12345678", "nickname": "직관러버" }
// Response 201
{ "id": "usr_xxx", "email": "a@a.com", "nickname": "직관러버" }
// Error 409: 이메일 또는 닉네임 중복
```

---

## 2. 프로필

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/users/me` | 🔒 | 내 프로필 전체 조회 (태그 포함) |
| PATCH | `/api/users/me` | 🔒 | 프로필 수정 (nickname, image, bio, favoriteTeamId) |
| PUT | `/api/users/me/tags` | 🔒 | 성향 태그 설정 (최대 5개, 통째로 교체) |
| GET | `/api/users/:userId` | - | 타인 프로필 조회 (공개 정보만) |
| GET | `/api/tags` | - | 선택 가능한 전체 태그 목록 |

**PATCH /api/users/me**
```json
// Request (일부 필드만 보내도 됨)
{ "bio": "직관 3년차, 3루 익사이팅존 선호", "favoriteTeamId": 2 }
// Response 200: 수정된 User 객체
```

**PUT /api/users/me/tags**
```json
// Request
{ "tagIds": [1, 3, 5] }  // 최대 5개, 초과 시 400
// Response 200: 반영된 태그 목록
```

---

## 3. 구단

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/teams` | - | 10구단 목록 (홈 탭용) |

---

## 4. 모집글 (Post)

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/teams/:teamId/posts` | - | 구단별 모집글 목록 |
| POST | `/api/posts` | 🔒 | 모집글 작성 |
| GET | `/api/posts/:postId` | - | 모집글 상세 (신청 현황 요약 포함) |
| PATCH | `/api/posts/:postId` | 🔒✓작성자 | 모집글 수정 |
| DELETE | `/api/posts/:postId` | 🔒✓작성자 | 모집글 삭제 |
| POST | `/api/posts/:postId/close` | 🔒✓작성자 | 수동 마감 (OPEN/MATCHED → CLOSED) |
| POST | `/api/posts/:postId/complete` | 🔒✓작성자 | 직관 완료 처리 → 작성자+ACCEPTED 신청자 watchCount +1 |

**GET /api/teams/:teamId/posts** 쿼리 파라미터
| 파라미터 | 설명 |
|---|---|
| `status` | `OPEN` \| `MATCHED` \| `CLOSED` (기본: OPEN+MATCHED만) |
| `dateFrom`, `dateTo` | 경기 날짜 범위 필터 |
| `sort` | `latest`(기본) \| `matchDate` \| `deadline` |
| `page`, `limit` | 페이지네이션 |

**POST /api/posts**
```json
// Request
{
  "teamId": 2,
  "title": "이번 주 토요일 잠실 직관 메이트 구해요",
  "content": "3루 익사이팅존에서 같이 응원하실 분!",
  "matchDate": "2026-08-29T18:30:00+09:00",
  "opponent": "두산",
  "stadiumZone": "3루 익사이팅존",
  "capacity": 3
}
// Response 201: 생성된 Post 객체 (status: OPEN)
```

**POST /api/posts/:postId/complete**
```json
// Response 200
{ "postId": "post_xxx", "completedAt": "...", "watchCountUpdated": ["usr_a", "usr_b", "usr_c"] }
// Error 400: 이미 완료 처리됨 / 경기 날짜 이전에는 처리 불가
```

---

## 5. 댓글 (Comment)

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/posts/:postId/comments` | - | 댓글 목록 |
| POST | `/api/posts/:postId/comments` | 🔒 | 댓글 작성 |
| DELETE | `/api/comments/:commentId` | 🔒✓작성자 | 댓글 삭제 |

---

## 6. 신청 (Application) — 신청/수락 승인제 핵심

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/posts/:postId/applications` | 🔒 | 모집글에 신청 (message 선택) |
| GET | `/api/posts/:postId/applications` | 🔒✓작성자 | 신청자 목록 조회 (작성자만) |
| PATCH | `/api/applications/:applicationId` | 🔒✓작성자 | 수락/거절 `{ "status": "ACCEPTED" }` |
| DELETE | `/api/applications/:applicationId` | 🔒✓신청자 | 신청 취소 (본인만, PENDING 상태에서만) |
| GET | `/api/users/me/applications` | 🔒 | 내가 신청한 모집글 목록 |

**POST /api/posts/:postId/applications**
```json
// Request
{ "message": "저도 3루쪽에서 볼게요! 같이 가요" }
// Response 201: Application(status: PENDING)
// Error 409: 이미 신청함 / 400: 본인 글에는 신청 불가 / 400: 이미 마감(CLOSED)된 글
```

**PATCH /api/applications/:applicationId**
```json
// Request
{ "status": "ACCEPTED" }  // 또는 "REJECTED"
// Response 200: 갱신된 Application
// 부수효과: 수락 인원이 capacity-1에 도달하면 Post.status → MATCHED,
//          나머지 PENDING 신청 건은 자동으로 REJECTED 처리 + 알림 발송
```

---

## 7. DM / 채팅방

Socket.io가 실시간 송수신을 담당하므로, REST는 방 생성/목록/초기 메시지 로드/나가기만 처리.

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/rooms` | 🔒 | 내 채팅방 목록 (마지막 메시지 미리보기, 안읽음 수 포함) |
| POST | `/api/rooms` | 🔒 | 상대와의 방 생성 또는 기존 방 반환 `{ "targetUserId": "usr_xxx" }` |
| GET | `/api/rooms/:roomId/messages` | 🔒✓참여자 | 메시지 목록 (커서 기반 페이지네이션, `leftAt` 이후 것만) |
| POST | `/api/rooms/:roomId/leave` | 🔒✓참여자 | 방 나가기 → `RoomParticipant.leftAt` 기록 |
| PATCH | `/api/rooms/:roomId/read` | 🔒✓참여자 | 읽음 처리 (내가 안 읽은 메시지 전부 readAt 기록) |

**POST /api/rooms**
```json
// Request
{ "targetUserId": "usr_xxx" }
// Response 200/201: { "roomId": "room_xxx" } — 이미 존재하면 200, 새로 생성이면 201
// Error 403: 상대가 나를 차단했거나 내가 상대를 차단한 경우
```

**GET /api/rooms/:roomId/messages** 쿼리: `cursor`, `limit`(기본 30)

---

## 8. 알림

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/notifications` | 🔒 | 알림 목록 (최신순, 페이지네이션) |
| PATCH | `/api/notifications/:id/read` | 🔒 | 단건 읽음 처리 |
| PATCH | `/api/notifications/read-all` | 🔒 | 전체 읽음 처리 |

---

## 9. 신고 / 차단

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/reports` | 🔒 | 신고 `{ "targetUserId", "reason" }` |
| POST | `/api/blocks` | 🔒 | 차단 `{ "blockedId" }` |
| DELETE | `/api/blocks/:blockedId` | 🔒 | 차단 해제 |
| GET | `/api/users/me/blocks` | 🔒 | 내가 차단한 목록 |

---

## 10. 소켓 이벤트 (Socket.io, REST 아님 — 참고용)

| 이벤트 | 방향 | payload | 설명 |
|---|---|---|---|
| `join-room` | client→server | `roomId` | 방 입장 |
| `send-message` | client→server | `{ roomId, senderId, content }` | 메시지 전송 → DB 저장 후 broadcast |
| `new-message` | server→client | Message 객체 | 같은 방 참여자 전원에게 broadcast |

---

## 11. 공통 규칙

- 인증 실패: `401 Unauthorized`
- 권한 없음(본인 아님 등): `403 Forbidden`
- 리소스 없음: `404 Not Found`
- 유효성 실패: `400 Bad Request` + `{ "errors": [...] }` (zod 검증 결과 매핑)
- 페이지네이션 응답 공통 포맷: `{ "items": [...], "nextCursor": "..." | null }`
- 목록 조회 API는 원칙적으로 차단 관계에 있는 유저의 게시물/유저 정보를 서로 숨김 처리 (Block 테이블 기준 필터링)
