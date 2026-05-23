# Antigravity 인수인계: Clinical Supervision Platform

작성일: 2026-05-23  
프로젝트 경로: `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform`  
현재 제품명 표기: 코드와 화면에는 `ClinicFlow`, 일부 이전 Stitch/문서에는 `ClinicalSup`/`Supervision Pro`가 섞여 있음. 앞으로는 사용자-facing 명칭을 `ClinicFlow`로 통일하는 것이 좋다.

## 1. 이 웹 프로그램은 무엇인가

이 프로젝트는 임상가가 슈퍼바이저를 찾고, 예약하고, 임상 자료를 안전하게 제출한 뒤, 슈퍼바이저가 웹 안에서 자료를 미리보고 주석/피드백/보완요청/승인도장을 처리하는 임상 슈퍼비전 플랫폼이다.

핵심 목표는 단순 예약 사이트가 아니다. 예약, 결제, 임상자료 제출, PHI 보호, 슈퍼바이저 검토, 완료 기록, 운영자 심사까지 한 흐름으로 묶는 것이다.

제품의 중심 가정은 다음과 같다.

- 모든 신규 사용자는 기본적으로 `슈퍼바이지`로 가입한다.
- 슈퍼바이저도 임상가이므로, 본인이 원하면 다른 슈퍼바이저에게 슈퍼비전을 받을 수 있다.
- 슈퍼바이저가 되려면 가입 후 별도 `슈퍼바이저 신청`과 자격 심사를 거친다.
- 예약 시스템은 제품의 핵심이며, Google Calendar 연동은 보류/문서화 기능이 아니라 필수 운영 의존성이다.
- Stitch HTML/Tailwind 샘플은 화면의 시각적 기준으로 취급하되, 실제 Next.js 라우트, DB, RLS, PHI, 결제, 파일 처리 로직 위에 이식해야 한다.

## 2. 역할 정의

`슈퍼바이지`

- 기본 가입 역할이다.
- 공개 슈퍼바이저 목록을 검색한다.
- 공개 프로필에서 서비스 상품과 가능 일정을 확인한다.
- 일정 예약 상품은 반드시 슈퍼바이저의 Google Calendar가 정상 연결된 경우에만 예약할 수 있다.
- 사례 패킷, 파일, 비식별화 체크리스트를 제출한다.
- 슈퍼바이저가 남긴 주석, 피드백, 보완요청, 완료 기록을 확인한다.

`슈퍼바이저`

- 슈퍼바이지가 설정 화면에서 신청한 후 관리자가 자격을 승인하면 활동할 수 있다.
- 프로필, 자격증빙, 전문분야, 서비스 상품, 반복 가능시간을 관리한다.
- Google Calendar OAuth를 연결해야 일정 예약 상품을 받을 수 있다.
- 슈퍼바이지가 제출한 자료를 플랫폼 안에서 미리보고 주석/피드백/보완요청/승인/완료 기록을 처리한다.
- 슈퍼바이저 계정이라도 다른 슈퍼바이저의 상품은 슈퍼바이지로 의뢰할 수 있다. 자기 자신의 상품은 의뢰할 수 없다.

`관리자`

- 슈퍼바이저 자격 신청을 심사한다.
- 환불, 정산, 감사 로그, 민감자료 다운로드를 관리한다.
- 현재 관리자 기능은 판매 가능한 운영 콘솔로 보기에는 아직 P0 보강이 필요하다. 아래 "남은 위험"을 반드시 먼저 확인한다.

## 3. 주요 도메인 정의

`supervisor_profiles`

- 슈퍼바이저 공개 프로필이다.
- 공개 검색과 프로필 상세 화면의 기반이다.
- `visibility=public`, `verification_status=approved`여야 공개 예약 후보가 된다.

`qualifications`, `qualification_evidence_files`

- 슈퍼바이저 자격/증빙 자료다.
- 현재 자격 승인과 프로필 승인 결합이 너무 느슨하다. 운영 전에는 심사 체크리스트를 분리해야 한다.

`service_products`

- 슈퍼바이저가 판매하는 슈퍼비전 상품이다.
- 일정 예약 상품: `zoom_60`, `zoom_90`
- 비동기 상품: 예를 들어 문서 코멘트/평가 보고서 검토 계열
- 일정 예약 상품은 Google Calendar 정상 연결 없이는 예약 생성과 재예약이 막힌다.

`availability_slots`

- 슈퍼바이저가 직접 설정하는 반복 가능시간이다.
- 공개 프로필의 캘린더는 이 슬롯과 Google FreeBusy, 플랫폼 내부 예약을 합쳐서 보여준다.
- A 슈퍼바이저의 캘린더는 A의 프로필/예약에서만 쓰이며, 다른 슈퍼바이저와 섞이면 안 된다.

`external_calendar_connections`, `external_calendar_events`

- Google Calendar OAuth 연결과 실제 Google 이벤트 링크다.
- 연결 상태가 `connected`가 아니거나 OAuth 설정이 없으면 예약 후보를 노출하지 않고 예약/재예약 API도 실패한다.

`supervision_requests`

- 슈퍼비전 의뢰의 중심 엔티티다.
- 상태는 draft, submitted, awaiting_payment, paid, awaiting_supervisor_review, accepted, in_review, feedback_submitted, additional_info_requested, completion_record_issued, completed, cancelled, refunded, expired 등을 포함한다.

`bookings`

- 일정 예약 상품의 실제 예약이다.
- 예약 상태는 scheduled, rescheduled, cancelled, completed, no_show_supervisee, no_show_supervisor 등을 가진다.
- Google 이벤트 생성/변경/삭제와 같이 움직여야 한다.

`case_packets`, `case_files`, `case_file_previews`, `case_file_annotations`

- 슈퍼바이지가 제출하는 사례 정보와 파일이다.
- 목표는 원자료를 내려받지 않고 웹 안에서 미리보기, 주석, 보완요청을 가능하게 하는 것이다.
- PHI 포함 파일 차단과 보존기간/삭제 경고가 구현되어 있다.

`completion_records`

- 슈퍼바이저가 최종 완료 기록을 발행하는 테이블이다.
- 법적 진단서/감정서/공식 의료기록이 아니라 플랫폼 내 슈퍼비전 완료 기록이라는 고정 책임 고지를 포함해야 한다.

`payments`, `refunds`, `payouts`

- 결제/환불/정산이다.
- 결제와 환불/정산 운영은 아직 강한 운영 안정성 보강이 필요하다.

`audit_logs`, `access_logs`

- 운영자 및 민감자료 접근 감사 기록이다.
- 현재 테이블은 있지만 모든 관리자 상태 변경/다운로드에 충분히 연결되어 있지 않다.

## 4. Stitch 기준 자료 위치

Stitch에서 가져온 HTML/Tailwind 샘플과 수동 override 기준은 이미 문서화되어 있다.

- `designs/stitch/MAPPING.md`
- `docs/decisions/STITCH-MIGRATION.md`
- `docs/decisions/STITCH-FUNCTIONAL-MAPPING.md`
- `docs/decisions/STITCH-MANUAL-OVERRIDE-SOURCES.md`
- `docs/decisions/STITCH-PIXEL-TRANSPOSITION.md`

중요한 방향:

- Stitch는 독립 정적 HTML이 아니라 실제 코드베이스에 이식할 시각 기준이다.
- HTML을 "더 깔끔하게 재해석"하지 말고, 가능한 한 Stitch의 레이아웃/카피/밀도/색상/구조를 보존한다.
- 단, `href="#"`, 가짜 버튼, demo-only 흐름은 모두 실제 라우트/API/상태 변경으로 연결해야 한다.
- 사용자가 최근 다시 제공한 샘플 기준은 슈퍼바이저 목록, 슈퍼바이저 프로필, 새 의뢰, 일정 관리, 의뢰심사/피드백 화면이다. 특히 의뢰심사/피드백 화면에는 기존에 구현한 웹 내 미리보기/주석 기능을 반드시 포함해야 한다.

## 5. 현재까지 구현된 큰 흐름

### 5.1 가입과 역할

- 가입 화면에서 `Clinical Role` 선택을 제거했다.
- 모든 사용자는 기본적으로 슈퍼바이지로 시작한다.
- 설정 화면에서 `슈퍼바이저 신청`을 통해 슈퍼바이저 프로필/심사 흐름으로 들어간다.
- 영어 filler 문구는 상당 부분 한국어로 정리했다. 아직 화면 일부에 `ClinicFlow`, `Secure Login`, 일부 영어 라벨이 남아 있을 수 있으니 다음 UI pass에서 확인한다.

관련 파일:

- `apps/web/src/app/(auth)/signup/signup-form.tsx`
- `apps/web/src/app/(supervisee)/settings/supervisor-application-button.tsx`

### 5.2 슈퍼바이저 검색/프로필

- `/supervisors` 검색 화면과 `/supervisors/[id]` 프로필 상세가 실제 DB 기반으로 동작한다.
- 공개 프로필에서는 서비스 상품과 가능 일정 미리보기를 보여준다.
- `의뢰 신청하기`와 `가능 일정 미리보기`를 분리했다.
- 일정 예약 상품은 캘린더에서 시간을 먼저 고른 뒤 `/requests/new`로 이동한다.
- 비동기 상품은 일정 없이 바로 의뢰 초안을 시작할 수 있다.
- 가능 일정 미리보기는 월/주차/날짜가 보이는 캘린더형 UI로 바뀌어 있다.

관련 파일:

- `apps/web/src/app/(public)/supervisors/page.tsx`
- `apps/web/src/app/(public)/supervisors/[id]/page.tsx`

### 5.3 Google Calendar 예약

현재 기준에서 Google Calendar는 보류 기능이 아니다.

완료된 것:

- 슈퍼바이저 OAuth 연결 라우트 구현
- Google FreeBusy 조회
- 예약 생성 시 Google Calendar 이벤트 생성
- Google Meet 링크 저장
- 재예약 시 Google 이벤트 PATCH 또는 새 이벤트 생성
- 취소/거절/환불/만료 시 Google 이벤트 취소 흐름
- Google 이벤트 취소 실패 재시도 스크립트
- 예약 생성/재예약 API에서 Google OAuth 설정 누락, 미연결, 재인증 필요, 동기화 오류를 차단
- 공개 프로필의 가능 일정에서도 Google 연결/설정/상태 문제가 있으면 예약 후보를 숨김
- 운영 스모크에서 Google OAuth 설정 누락을 실패로 처리

최근 핵심 변경 파일:

- `apps/web/src/lib/google-calendar.ts`
- `apps/web/src/app/api/supervision-requests/route.ts`
- `apps/web/src/app/api/supervision-requests/[id]/reschedule/route.ts`
- `apps/web/src/app/(public)/supervisors/[id]/page.tsx`
- `apps/web/src/app/api/me/google-calendar/sync-check/route.ts`
- `apps/web/src/lib/api/envelope.ts`
- `scripts/ops-smoke.ts`
- `README.md`

중요한 상태 코드/에러 코드:

- `calendar_config_required`: 서비스의 Google OAuth 설정이 없음. 예약/재예약 불가.
- `calendar_not_connected`: 슈퍼바이저가 Google Calendar를 연결하지 않음.
- `calendar_reauth_required`: 토큰 만료/재인증 필요.
- `calendar_sync_failed`: Google Calendar 상태 확인 실패.

### 5.4 의뢰 목록

- `/requests`는 슈퍼바이지로 보낸 자료와 슈퍼바이저로 받은 자료를 나눠 보여주도록 정리했다.
- 영어 중심의 `My Requests`, `Next: ...` 같은 표현은 한국어로 추가 정리가 필요할 수 있다.
- 각 행의 버튼은 단순 표시가 아니라 실제 작업 페이지로 넘어가야 한다. 일부는 연결됐지만, 각 상태별 CTA가 최종 제품 수준인지 다시 봐야 한다.

관련 파일:

- `apps/web/src/app/(supervisee)/requests/page.tsx`
- `apps/web/src/app/(supervisee)/requests/[id]/page.tsx`
- `apps/web/src/app/(supervisee)/requests/[id]/request-detail-client.tsx`

### 5.5 의뢰 상세, 파일 미리보기, 주석

- 사례 파일 업로드, signed/local upload, preview, annotation API가 있다.
- 슈퍼바이저 작업 화면에서 파일을 보고 바로 주석을 남기는 방향으로 구현되어 있다.
- 단, 현재 주석은 아직 "판매 가능한 협업 문서 검토" 수준까지는 부족하다. 아래 남은 작업 참조.

관련 파일:

- `apps/web/src/components/case-files-panel.tsx`
- `apps/web/src/app/api/case-files/[id]/preview/route.ts`
- `apps/web/src/app/api/case-files/[id]/annotations/route.ts`
- `packages/db/src/files.ts`

### 5.6 슈퍼바이저 작업 큐와 완료 기록

- 슈퍼바이저 `/supervisor/requests`는 작업 대상, 예약/결제 대기, 완료/보관, 닫힌 의뢰를 나눠 보이도록 정리했다.
- 완료 기록 발행에는 고정 책임 고지가 들어간다.
- 완료 기록은 슈퍼바이지 의뢰 상세에서 확인할 수 있도록 보강했다.
- 완료 기록 필드에 PHI가 들어가지 않도록 기본 검사를 넣었다.

관련 파일:

- `apps/web/src/app/(supervisor)/supervisor/requests/page.tsx`
- `apps/web/src/app/(supervisor)/supervisor/requests/[id]/request-workflow.tsx`
- `apps/web/src/app/api/supervision-requests/[id]/completion/route.ts`
- `apps/web/src/lib/supervision/completion-record.ts`
- `packages/db/src/supervision.ts`

### 5.7 결제, 환불, 정산

- Toss 결제 intent/confirm/webhook 기본 흐름이 있다.
- 환불 요청/관리자 환불 처리 화면이 있다.
- 정산 계산 화면이 있다.
- 그러나 환불/정산은 아직 운영용으로 닫혔다고 보면 안 된다. 아래 P0 남은 작업을 먼저 처리해야 한다.

관련 파일:

- `apps/web/src/app/api/payments/*`
- `apps/admin/src/app/admin/refunds/page.tsx`
- `apps/admin/src/app/admin/payouts/page.tsx`
- `packages/db/src/payments.ts`

## 6. 최근 검증 결과

현재 세션에서 확인한 검증:

- `pnpm typecheck`: 통과
- `pnpm test apps/web/src/lib/supervision/supervision.integration.test.ts -- --runInBand`: 통과, 35 passed / 2 skipped
- `pnpm build`: 통과
- `pnpm ops:smoke`: 실패가 정상이다. 현재 로컬 환경에 `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`이 없으므로 `google_calendar`가 fail로 떨어진다. 예약 시스템이 생명이라는 판단에 맞춰, 운영 준비 상태에서는 이 값 누락을 warn으로 넘기지 않게 바꿨다.

아직 하지 않은 검증:

- 최신 변경 이후 `pnpm lint`
- 최신 변경 이후 `pnpm drizzle:check`
- 최신 변경 이후 `pnpm journey:matrix`
- 실제 Google OAuth 계정으로 FreeBusy/이벤트 생성/변경/삭제 end-to-end 확인
- 브라우저에서 최신 화면을 다시 캡처해 시각 회귀 확인

## 7. 바로 이어서 해야 할 작업

### P0. 실제 Google Calendar 파일럿 검증

가장 먼저 해야 한다.

1. `.env.local`에 실제 Google OAuth 값을 넣는다.
2. Google Cloud Console에서 redirect URI를 등록한다.
3. 슈퍼바이저 계정으로 `/supervisor/availability`에서 Google Calendar를 연결한다.
4. 공개 프로필에서 가능 일정이 Google busy time을 제외하고 보이는지 확인한다.
5. 슈퍼바이지로 예약 생성 시 Google 이벤트와 Meet 링크가 생기는지 확인한다.
6. 재예약 시 Google 이벤트가 PATCH되는지 확인한다.
7. 취소/거절/만료/환불 시 이벤트가 취소되는지 확인한다.
8. `pnpm ops:smoke`가 Google 항목에서 통과하는지 확인한다.

관련 명령:

```bash
cd /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform
pnpm typecheck
pnpm test apps/web/src/lib/supervision/supervision.integration.test.ts -- --runInBand
pnpm build
pnpm ops:smoke
```

### P0. 관리자 감사 로그 연결

관리자 에이전트 감사에서 가장 큰 운영 리스크로 나온 부분이다.

해야 할 것:

- 자격 승인/반려 API에 `audit_logs` insert
- 환불 승인/반려 API에 `audit_logs` insert
- 정산 계산/상태 변경 API에 `audit_logs` insert
- 자격 증빙 원본 다운로드 API에 `audit_logs`와 `access_logs` insert
- 감사 화면에서 reason, actor, target id, before/after, IP, user-agent를 볼 수 있게 표시

관련 파일:

- `apps/admin/src/app/api/admin/qualifications/[id]/approve/route.ts`
- `apps/admin/src/app/api/admin/qualifications/[id]/reject/route.ts`
- `apps/admin/src/app/api/admin/refunds/[id]/approve/route.ts`
- `apps/admin/src/app/api/admin/refunds/[id]/reject/route.ts`
- `apps/admin/src/app/api/admin/qualification-evidence/[id]/download/route.ts`
- `packages/db/src/ops.ts`
- `apps/admin/src/app/admin/audit/page.tsx`

### P0. 관리자 IP allowlist 신뢰 경계

현재 관리자 IP allowlist는 `x-forwarded-for` 등 spoof 가능한 헤더를 그대로 믿을 수 있다.

해야 할 것:

- 배포 플랫폼의 immutable client IP만 사용하도록 정리한다.
- trusted proxy chain 검증 또는 직접 접근 차단을 추가한다.
- 운영 배포 문서에 프록시 경계와 allowlist 설정법을 명확히 쓴다.

관련 파일:

- `apps/admin/src/lib/auth/admin-network.ts`

### P0. 환불 idempotency와 재처리

현재 Toss 환불 호출과 내부 DB 상태 변경이 완전한 outbox/idempotency 구조가 아니다.

해야 할 것:

- `refund_attempts` 테이블 추가
- Toss idempotency key 사용
- 외부 성공/내부 반영 실패 상태 저장
- 재처리 화면 또는 스크립트 추가
- 환불 승인 API를 idempotent하게 변경

관련 파일:

- `packages/shared/src/payments/toss/prod.ts`
- `apps/admin/src/app/api/admin/refunds/[id]/approve/route.ts`
- `packages/db/src/payments.ts`

### P0. 정산 지급 운영

현재 정산은 계산 중심이다. 실제 지급 운영 콘솔이 아니다.

해야 할 것:

- 지급 상태 전환 API
- 지급 보류/실패/완료 사유
- 송금 파일 export
- 지급 증빙 업로드
- 세금계산서/원천징수 필드
- 정산 관련 감사 로그

관련 파일:

- `apps/admin/src/app/admin/payouts/page.tsx`
- `apps/admin/src/app/api/admin/payouts/compute/route.ts`
- `packages/db/src/payments.ts`

### P1. 세션 결과 기록 보강

현재 슈퍼바이저가 세션 결과를 너무 쉽게 `completed/no_show`로 바꿀 수 있다.

해야 할 것:

- 결과 기록 전 확인 단계 추가
- 사유 입력 필수화
- 사유 PHI 검사
- 결과 사유를 DB에 저장하거나 최소한 감사 로그/알림 metadata에 남김
- 완료/노쇼 변경의 취소 또는 정정 플로우 검토

관련 파일:

- `apps/web/src/app/api/supervision-requests/[id]/session-outcome/route.ts`
- `apps/web/src/app/(supervisor)/supervisor/requests/[id]/request-workflow.tsx`
- `packages/db/src/supervision.ts`

### P1. 웹 내 주석/미리보기 고도화

현재 미리보기/주석은 있으나, 사용자가 원하는 “웹사이트 내에서 바로바로 주석”의 최종 형태로는 더 다듬어야 한다.

해야 할 것:

- 문서 위치 기반 anchored annotation
- 주석 thread / resolve / reopen
- 파일 버전 또는 document review cycle과 주석 연결
- 보완요청과 주석 연결
- 최종 보고서/원자료/raw data 등 파일 유형별 CTA 분기
- 슈퍼바이저 작업 화면에서 미리보기 패널을 더 중심에 배치

관련 파일:

- `apps/web/src/components/case-files-panel.tsx`
- `packages/db/src/files.ts`
- `packages/db/src/supervision.ts`
- `apps/web/src/app/(supervisor)/supervisor/requests/[id]/request-workflow.tsx`

### P1. 자격 승인과 프로필 공개 승인 분리

현재 한 자격 승인으로 슈퍼바이저 프로필 전체가 approved가 되는 구조가 남아 있다.

해야 할 것:

- 자격 파일 승인과 프로필 공개 승인을 분리
- 신원/면허/만료일/전문영역/상품/정산정보 체크리스트 추가
- 프로필 공개 전 admin checklist gate 추가

관련 파일:

- `packages/db/src/profiles.ts`
- `apps/admin/src/app/admin/qualifications/page.tsx`

### P1. 문서 정합성 업데이트

최근 코드 기준으로 `README.md`는 업데이트했지만, 일부 결정 문서에는 아직 이전 기준이 남아 있다.

확인할 문서:

- `docs/decisions/OPS-FOUNDATION.md`
- `docs/reviews/TRACEABILITY_MATRIX.md`
- `docs/reviews/IMPLEMENTATION_AUDIT.md`
- `docs/reviews/PATCH_QUEUE.md`

특히 Google Calendar를 development warn으로 남기는 문구는 현재 정책과 다르다. 예약 시스템은 필수 기능이므로 launch gate로 다뤄야 한다.

## 8. Antigravity에서 추천 작업 순서

1. 현재 코드 상태에서 `pnpm typecheck`, `pnpm test apps/web/src/lib/supervision/supervision.integration.test.ts -- --runInBand`, `pnpm build`를 한 번 재확인한다.
2. 실제 Google Calendar OAuth 값을 넣고 예약 end-to-end를 수동 검증한다.
3. `pnpm ops:smoke`를 Google 항목까지 통과시키거나, 실패 원인을 명시한다.
4. 관리자 감사 로그 P0를 먼저 닫는다.
5. 환불 idempotency P0를 닫는다.
6. 정산 지급 운영 P0를 닫는다.
7. 세션 결과 기록 사유/감사 trail을 보강한다.
8. 미리보기/주석 UX를 Stitch 의뢰심사 화면에 맞춰 중심 기능으로 다듬는다.
9. `pnpm lint`, `pnpm drizzle:check`, `pnpm journey:matrix`, `pnpm demo:run`을 돌린다.
10. Stitch fidelity pass를 하되, 기능이 죽지 않는지 API/journey test를 같이 본다.

## 9. 주의할 점

- 이 프로젝트 루트는 현재 git repository로 잡히지 않을 수 있다. `git diff`가 실패했다. Antigravity에서 열 때 작업 내역 추적 방식을 먼저 확인하라.
- PGlite 데모는 유용하지만 운영 준비 증거가 아니다. 실제 Google/Toss/Storage/Mailer credential 기반 smoke가 필요하다.
- `demo-evidence`는 참고 자료다. 운영 인수 기준은 실제 DB, 실제 Google Calendar, 실제 PG/Storage/Mailer smoke여야 한다.
- PHI는 Google Calendar 이벤트에 절대 넣으면 안 된다. 현재 이벤트 title/description은 환자정보 없이 `ClinicFlow 슈퍼비전` 수준으로 제한되어 있다.
- 사용자는 영어 filler와 fake button을 싫어한다. 화면에 영어가 남아 있거나 클릭해도 실제 작업으로 가지 않는 요소는 버그로 취급하라.
- 사용자는 Stitch HTML의 시각적 충실도를 중요하게 본다. 단, `href="#"`는 실제 기능으로 바꿔야 한다.

## 10. 마지막 현재 상태 요약

현재 상태는 "핵심 예약 로직을 Google Calendar 필수 흐름으로 끌어올렸고, 타입/예약 통합 테스트/빌드는 통과한 상태"다.

하지만 "판매 가능한 최종 제품"이라고 말하려면 아직 부족하다. 특히 관리자 감사 로그, 환불 idempotency, 실제 지급 운영, 세션 결과 사유/감사, 주석 협업 UX, 실제 Google OAuth 수동 검증이 남아 있다.

Antigravity에서 이어갈 때는 UI를 더 만지기 전에 Google Calendar 실제 연동과 관리자 P0 운영 리스크를 먼저 닫는 것이 맞다. 예약 시스템이 생명이라는 사용자의 판단에 맞춰, 이제 캘린더가 없는 예약은 기능이 아니라 실패 상태로 취급된다.
