# 직메 (jikme) 기획 문서

## 1. 서비스 개요

같은 구단을 응원하는 사람끼리 직관(야구장 직접 관람) 메이트를 구하는 웹 서비스.
"소개팅앱처럼 매력적으로 프로필을 보여주되, 당근마켓처럼 가볍고 빠르게 모집글 올리고 매칭"하는 컨셉.

**타겟 유저**: 혼자 직관 가기 애매한 사람, 같이 갈 사람 없어서 못 가는 사람, 같은 팀 팬끼리 친목 원하는 사람

**핵심 가치**: 구단 커뮤니티(소속감) + 날짜/좌석 기반 매칭(실용성) + 실시간 대화(연결)

---

## 2. 유저 플로우

```
회원가입/로그인 (이메일 or 카카오)
   ↓
온보딩: 응원팀 선택 + 성향 태그 선택 + 닉네임/한줄소개 입력
   ↓
홈 (10구단 탭) → 응원팀 게시판 진입
   ↓
┌─────────────────────┬─────────────────────┐
│ 모집글 둘러보기          │ 모집글 작성           │
│ (날짜/구역 필터)        │ (경기/구역/인원/내용)   │
└─────────────────────┴─────────────────────┘
   ↓
모집글 상세 → 댓글 or DM 신청
   ↓
DM 방 생성 → 실시간 채팅으로 약속 조율
   ↓
(직관 완료 후) 모집글 상태 CLOSED, 직관 횟수 +1
```

---

## 3. 기능 명세

### 3.1 회원가입 / 로그인

| 항목 | 내용 |
|---|---|
| 방식 | 이메일+비밀번호, 카카오 소셜 로그인 |
| 이메일 가입 입력값 | 이메일, 비밀번호, 비밀번호 확인, 닉네임 |
| 유효성 | 이메일 형식 검증, 비밀번호 8자 이상, 닉네임 중복 확인(실시간) |
| 카카오 가입 | 최초 로그인 시 이메일 계정과 동일하게 "온보딩" 단계로 이동 (닉네임 미설정 상태) |
| 로그인 실패 처리 | 이메일/비밀번호 불일치 시 공통 에러 메시지 (계정 존재 여부 노출 금지) |
| 세션 | NextAuth JWT 세션, 만료 기간 30일 |

**결정**: 이메일 인증은 v2로 미룸. v1은 이메일 형식 검증까지만 하고 실제 메일 발송 인증 절차는 넣지 않음

### 3.2 프로필

| 항목 | 내용 | 필수 여부 |
|---|---|---|
| 프로필 사진 | 이미지 업로드 (기본 이미지 제공) | 선택 |
| 닉네임 | 2~12자, 중복 불가 | 필수 |
| 응원팀 | 10구단 중 1개 | 필수 |
| 성향 태그 | 사전 정의 태그 중 최대 5개 선택 (예: "직관 초보", "조용히 관람", "포토그래퍼", "먹으러 감", "열정 응원단") | 선택 |
| 직관 횟수 | 자동 집계 | 자동 |
| 한줄 소개 | 최대 50자 | 선택 |

**결정**: 직관 횟수는 자동 집계. 모집글 작성자가 경기 이후 "직관 완료" 처리를 하면, 그 글의 작성자 본인 + 수락(ACCEPTED)된 신청자 전원의 `watchCount`가 +1 됨. 직접 입력 불가.

### 3.3 구단별 게시판

- 홈 화면에 10개 구단 탭 (두산/LG/KT/삼성/롯데/한화/KIA/SSG/NC/키움)
- 탭 진입 시 해당 구단 모집글 목록 (최신순 기본, 날짜순/마감임박순 정렬 옵션)
- 필터: 직관 날짜 범위, 모집 상태(모집중/마감)

### 3.4 직관 메이트 모집글

| 필드 | 타입 | 필수 |
|---|---|---|
| 제목 | 텍스트 | 필수 |
| 경기 날짜/시간 | 날짜+시간 | 필수 |
| 상대 구단 | 10구단 중 선택 | 선택 |
| 응원 구역 | 텍스트 (예: "3루 익사이팅존") | 선택 |
| 모집 인원 | 숫자 (본인 포함 몇 명) | 필수, 기본값 2 |
| 내용 | 텍스트(자유 서술) | 필수 |
| 상태 | 모집중(OPEN) / 매칭완료(MATCHED) / 마감(CLOSED) | 자동+수동 |

**결정**: 신청 → 수락 승인제로 진행.

- 유저가 모집글에 "신청" (한마디 메시지 선택 입력) → `Application` 레코드 생성 (PENDING)
- 작성자는 신청자 목록에서 개별 수락/거절 가능
- 수락된 인원(ACCEPTED)이 `capacity - 1`(작성자 본인 제외)에 도달하면 모집글 상태가 자동으로 `MATCHED`로 전환되고, 남은 PENDING 신청은 자동 거절되거나 "마감됨" 안내
- 작성자가 언제든 수동으로 `CLOSED` 전환 가능 (모집 취소)
- 경기 날짜가 지나면 조회 시점에 자동으로 `CLOSED` 처리
- 경기 이후 작성자가 "직관 완료" 버튼을 누르면 `isCompleted=true`, `completedAt` 기록 → 작성자+ACCEPTED 신청자 전원 `watchCount` +1 (3.2 참고)
- 모집글에 댓글 작성 가능 (공개 댓글 — 신청 전 가벼운 질문용, 신청 자체는 별도 액션)

### 3.5 DM 1:1 실시간 채팅

- 모집글 상세에서 "DM 보내기" → 1:1 채팅방 생성 (이미 존재하면 기존 방으로 이동)
- Socket.io 기반 실시간 송수신
- 읽음 표시 (readAt)
- 채팅방 목록 화면 (최근 대화 미리보기 + 안읽은 메시지 표시)
- **결정**: 신고/차단 기능 v1 포함. 채팅방 및 상대 프로필에서 신고(사유 입력)·차단 가능. 차단 시 상호 DM 발송 불가, 모집글/댓글 노출에서도 서로 숨김 처리(추후 상세 정책 확정 필요)

**미정 사항**: 채팅 메시지 보관 기간 — 아래 별도 확인 필요

### 3.6 알림

| 타입 | 발생 시점 |
|---|---|
| NEW_COMMENT | 내 모집글에 댓글이 달렸을 때 |
| NEW_MESSAGE | DM 새 메시지 도착 (채팅방 밖에 있을 때) |
| POST_MATCHED | (v2) 매칭 승인 시스템 도입 시 |
| SYSTEM | 공지/시스템 알림 |

- MVP는 인앱 알림(벨 아이콘 + 목록)만, 푸시 알림은 v2에서 고려

---

## 4. 화면 목록 (사이트맵)

```
/                        홈 (10구단 탭)
/login, /register        로그인/회원가입
/onboarding               최초 가입 시 프로필 설정
/teams/[teamId]           구단별 게시판
/posts/[postId]           모집글 상세
/posts/new                모집글 작성
/dm                       채팅방 목록
/dm/[roomId]              채팅방
/profile                  내 프로필
/profile/[userId]         타인 프로필
/notifications            알림 목록
```

---

## 5. DB 설계

### 5.1 ERD 요약

```
User ──┬── favoriteTeam ──> Team
       ├── UserTag ──> Tag (다대다)
       ├── Post (1:N, 작성자)
       ├── Comment (1:N, 작성자)
       ├── RoomParticipant ──> Room (다대다, DM방 참여)
       ├── Message (1:N, 발신자)
       └── Notification (1:N)

Team ── Post (1:N)
Post ── Comment (1:N)
Post ── Application (1:N) ──> User(applicant)
Room ── Message (1:N)
User ── Report (신고자/피신고자 양방향)
User ── Block (차단자/피차단자 양방향)
```

### 5.2 테이블 명세

**User**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | String(cuid) | PK |
| email | String? | unique, 카카오 전용 계정은 null 가능 |
| password | String? | 해시 저장, 카카오 계정은 null |
| nickname | String | unique |
| image | String? | 프로필 사진 URL |
| favoriteTeamId | Int? | FK → Team |
| bio | String? | 한줄 소개 |
| watchCount | Int | 직관 횟수, 기본 0 |

**Team**: id, name(unique), shortCode(unique), logoUrl

**Tag / UserTag**: 태그 마스터 + 유저-태그 다대다 중간 테이블

**Post**
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | String | PK |
| authorId | String | FK → User |
| teamId | Int | FK → Team |
| title, content | String | |
| matchDate | DateTime | 경기 일시 |
| opponent | String? | 상대 구단 |
| stadiumZone | String? | 응원 구역 |
| capacity | Int | 모집 인원(작성자 포함), 기본 2 |
| status | Enum(OPEN/MATCHED/CLOSED) | |
| isCompleted | Boolean | 직관 완료 처리 여부 |
| completedAt | DateTime? | 완료 처리 시각 |

**Comment**: id, postId(FK), authorId(FK), content, createdAt

**Application** (신규 — 신청/수락 승인제)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | String | PK |
| postId | String | FK → Post |
| applicantId | String | FK → User |
| status | Enum(PENDING/ACCEPTED/REJECTED) | |
| message | String? | 신청 시 한마디 |
| (postId, applicantId) | unique | 중복 신청 방지 |

**Room / RoomParticipant / Message**: DM 채팅방 구조 — Room 하나에 여러 참여자(N:M), 메시지는 Room에 귀속. `RoomParticipant.leftAt`으로 "나간 사람 화면에서만 숨김" 처리 (5.3 참고)

**Notification**: id, userId(FK), type(Enum: NEW_COMMENT/NEW_MESSAGE/NEW_APPLICATION/APPLICATION_ACCEPTED/APPLICATION_REJECTED/WATCH_COMPLETED/SYSTEM), message, link, isRead, createdAt

**Report** (신규 — 신고, v1)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | String | PK |
| reporterId | String | FK → User (신고자) |
| targetUserId | String | FK → User (피신고자) |
| reason | String | 신고 사유 |
| status | Enum(PENDING/REVIEWED) | |

**Block** (신규 — 차단, v1)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | String | PK |
| blockerId | String | FK → User (차단한 사람) |
| blockedId | String | FK → User (차단당한 사람) |
| (blockerId, blockedId) | unique | 중복 차단 방지 |

> 실제 컬럼 제약조건과 관계는 `prisma/schema.prisma`에 이미 반영되어 있습니다. 이 문서는 스키마의 "기획 관점 설명"이고, 실제 소스는 스키마 파일이 원본입니다.

---

## 6. MVP 범위 정의

**v1 (MVP)에 포함**
- 이메일+카카오 로그인, 온보딩
- 프로필(태그, 응원팀, 한줄소개)
- 구단별 게시판, 모집글 CRUD
- 댓글
- DM 실시간 채팅 + 읽음 표시
- 기본 신고/차단
- 인앱 알림

**v2 이후로 미룸**
- 매칭 승인(신청→수락) 플로우
- 직관 횟수 자동 집계
- 푸시 알림
- 이메일 인증
- 프로필 사진 여러 장 / 갤러리
- 평점·후기 시스템

---

## 7. 결정 현황

| 항목 | 결정 |
|---|---|
| 이메일 인증 | v2로 미룸 |
| 직관 횟수 집계 | 자동 집계 (작성자의 "직관 완료" 처리 시 작성자+수락된 신청자 전원 +1) |
| 모집 인원 마감 | 신청 → 수락 승인제 (`Application` 테이블, PENDING/ACCEPTED/REJECTED) |
| DM 신고/차단 | v1 포함 (`Report`, `Block` 테이블) |
| 채팅 메시지 보관 정책 | 나간 사람 화면에서만 삭제 (상대방은 계속 보임) |

**채팅 메시지 보관 정책 상세**: 유저가 채팅방을 "나가기" 하면 `RoomParticipant.leftAt`에 시각이 기록됨. 이 유저의 화면에서는 `leftAt` 이후(및 이전) 메시지가 더 이상 보이지 않지만(=채팅방 목록/내역에서 숨김), 메시지 자체는 DB에서 삭제되지 않고 상대방 화면에는 그대로 남아 있음. 같은 상대와 다시 DM을 시작하면 기존 Room을 재사용할지, 새 Room을 만들지는 추후 결정 필요 (재사용 시 나간 사람에게는 나가기 이후 메시지부터 다시 보이게 하는 방식 제안).
