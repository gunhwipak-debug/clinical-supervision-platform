# OPS Foundation Decisions

이 문서는 Stitch/Figma UI 재구성 전에 운영 전환 기반을 정리한 결정 기록이다. 이번 묶음은 로컬 PGlite 데모를 유지하면서 실제 Postgres/Supabase 전환을 점검할 수 있는 어댑터와 smoke test를 추가하는 데 한정한다.

## Scope

- 로컬 데모 경로는 계속 `DEV_DB=pglite`, `STORAGE_MODE=local`, `TOSS_MODE=dev`, `MAILER_MODE=dev`를 기본으로 둔다.
- 운영 전환은 외부 credential 없이도 코드 수준에서 dry-run 가능해야 하므로 `pnpm ops:smoke`는 로컬 credential 미설정을 warn/skipped로 기록한다. 단, production에서는 Toss와 구글 캘린더처럼 실제 운영 기능을 막는 credential 누락을 fail로 처리한다.
- 기존 RLS 정책, PHI GUC 범위, auth/session 경계는 변경하지 않는다.
- Stitch/Figma UI 재디자인, 소셜 로그인 OAuth(Kakao/Naver), 실제 결제 승인 e2e는
  이번 범위에서 제외한다. 실제 메일 발송은 `MAILER_MODE=resend`로 구현되어 있으며
  운영에서는 `RESEND_API_KEY`와 검증된 `MAIL_FROM`을 요구한다. 구글 캘린더는
  보류가 아니며, 현재 앱 기능으로 OAuth 연동, FreeBusy 충돌 제외, 예약 이벤트
  생성, 수퍼바이지 참석자 초대, Meet 링크 저장, 일정 변경, 취소/거절/전액 환불 시
  이벤트 삭제와 참석자 알림까지 처리한다. 일정 예약 상품은 슈퍼바이저의 구글
  캘린더 연결과 FreeBusy 확인이 성공한 경우에만 예약을 받는다.
- 세션 전 리마인더는 `pnpm notifications:session-reminders`가 담당한다. 운영
  스케줄러는 이 명령을 주기적으로 호출하고, 같은 의뢰/시작시간 조합은 중복 발행하지
  않는다.
- 자료 보존기간 만료 경고는 `pnpm notifications:retention-warnings`가 담당한다.
  운영 스케줄러는 purge 전에 이 명령을 호출하고, 같은 의뢰/만료시각 조합은 중복
  발행하지 않는다.
- 결제나 제출 없이 오래 방치된 예약 hold는 `pnpm bookings:expire-holds`가
  `expired` 상태로 전환하고, 로컬 booking과 구글 캘린더 이벤트를 정리한다.

## Storage Adapter

- `StorageAdapter` 계약은 유지하고 `STORAGE_MODE=local|supabase|s3` factory를 추가했다.
- Local adapter는 기존 `dev-data/storage` 파일 경로와 token URL 방식을 그대로 유지한다.
- Supabase adapter는 service role REST 호출을 서버 안에서만 수행한다. 브라우저에는 기존처럼 짧은 수명의 서버 signed token만 전달한다.
- S3 adapter는 AWS Signature V4 골격을 포함한다. 정식 운영에서는 Seoul region, KMS, bucket policy, lifecycle rule을 함께 검증해야 한다.
- Supabase Storage는 파일럿에 적합하지만 객체 단위 KMS·대용량 운영·감사 요구가 커지면 S3+KMS 전환을 우선 검토한다.

## File Security Gaps

- ClamAV 실시간 검사, OCR 기반 PDF PHI scan, true PDF watermark는 아직 미구현이다.
- EPIC 5 재정의에 따라 PDF/image/office/HWP 파일 업로드는 허용한다. OCR/강제
  익명화는 제출 게이트가 아니며, UI/문서에서는 accepted file이 자동 익명화 또는
  OCR-clean 처리됐다고 표현하지 않는다.
- retention purge는 `pnpm files:purge-expired -- --dry-run`으로 대상 확인 후 운영 스케줄러가 `pnpm files:purge-expired`를 호출한다.

## Toss Adapter

- `TOSS_MODE=dev`는 기존 결정론적 DevTossClient를 유지한다.
- `TOSS_MODE=prod`는 fetch 주입형 `ProdTossClient`를 추가했다. confirm/refund는 mock fetch 단위 테스트로 검증한다.
- webhook signature는 `TOSS_WEBHOOK_SECRET` 기반 HMAC 검증으로 fail-closed 처리한다.
- 실제 토스 콘솔 키, 웹훅 URL 등록, mock 없는 승인 e2e는 사람 확인 필요 항목으로 남긴다.

## Webhook Signature

- Toss webhook 검증은 반드시 raw request body 문자열 위에서 수행한다.
- route는 `request.text()`를 먼저 캡처하고, client는 HMAC 통과 후에만 `JSON.parse(rawBody)`로 payload를 재구성한다.
- 같은 JSON 객체라도 key 순서나 공백이 달라져 raw body가 바뀌면 기존 signature는 무효다.
- dev/prod adapter 모두 같은 raw-body signature 계약을 사용한다.

## Mailer Adapter

- 기본 `MAILER_MODE=dev`는 기존 DevConsoleMailer로 유지한다.
- `MAILER_MODE=resend`는 Resend HTTP API로 실제 메일을 보낸다. SDK 없이
  `POST /emails`를 호출하고, `MAIL_FROM`, `RESEND_API_KEY` 누락 시 fail-closed한다.
- `MAILER_MODE=resend_stub`는 SDK 없이 payload 구조를 검증하는 stub이다.
- `MAILER_MODE=smtp_dry_run`는 credential 검증과 dry-run logger까지만 제공한다. 실제 SMTP 전송은 발신 도메인, SPF, DKIM, bounce 정책 확인 후 별도 구현한다.
- 과거 `MAILER_MODE=smtp` 값은 deprecated alias로만 받아들이고 경고를 출력한다.
- dry-run send는 매 호출마다 실제 발송이 없음을 경고한다.

## Admin And Audit

- admin TOTP와 admin reason 정책을 `apps/admin/src/lib/auth/admin-policy.ts`로 모았다.
- reason 기준은 30자 이상이다. route body schema 또는 header helper가 같은 기준을 사용한다.
- audit/access log는 `packages/db/src/audit.ts` helper와 `GET /api/admin/audit` 최소 API로 조회한다.
- 관리자 PHI 본문 노출 화면은 만들지 않았다. EPIC 10/11에서 별도 감사 UX와 IP allowlist를 검토한다.

## Admin Reason Policy

- admin reason은 header나 body에서 명시적으로 들어온 값만 사용한다.
- `adminReasonFromHeaders`에는 fallback 파라미터가 없으며, 라우트는 `isValidAdminReason` 실패 시 `403 admin_reason_required`를 반환한다.
- refunds/dashboard/audit/payouts 계열 admin API는 같은 30자 이상 기준을 공유한다.
- 테스트는 reason 미설정, 30자 미만, 30자 이상 케이스를 분리해 fallback 회귀를 막는다.

## Storage Secret

- local signed URL 토큰의 HMAC secret은 `LOCAL_STORAGE_SECRET`만 사용한다. `BETTER_AUTH_SECRET`이나 하드코드 운영 fallback은 사용하지 않는다.
- production에서 `LOCAL_STORAGE_SECRET`이 없으면 fail-fast로 중단한다.
- development/test에서만 별도 dev-only 상수를 쓰며, 이 경우 console warning을 남긴다.
- 운영 전환 시 auth secret과 storage token secret은 독립 secret으로 등록해야 한다.

## Signed Download URL

- signed download token payload에는 admin reason을 넣지 않는다.
- admin이 download URL을 발급할 때 `audit_logs`에 `action='signed_url_issue'`, `target_type='case_file'`, `signedUrlId`, `reason`을 기록한다.
- signed download 재생 시 admin RLS 통과에 reason이 필요하면 token의 `signedUrlId`로 발급 audit row를 조회해 GUC에만 사용한다.
- URL/token에는 reason 평문이 없고, 사유 원본은 감사 로그에만 남긴다.

## Ops Smoke

- `pnpm ops:smoke`는 다음을 점검한다: DB env, runtime/service role 분리, pgcrypto roundtrip, Storage adapter config, Toss adapter dry-run, Mailer config, purge dry-run.
- 구글 캘린더 OAuth 설정도 점검한다. development에서는 누락 시 warn으로
  표시하지만, production에서는 예약 동기화가 빠지지 않도록 fail로 처리한다.
- 결과는 `demo-evidence/ops-smoke.json`과 `demo-evidence/OPS-REPORT.md`에 남긴다.
- 로컬 PGlite에서는 role split이 동일 인스턴스라 warn으로 기록한다. 운영 Postgres에서는 `DATABASE_URL`은 `csp_app`, `SERVICE_DATABASE_URL`은 service role이어야 한다.

## People Confirmation Needed

- Supabase 프로젝트와 private Storage bucket 생성.
- S3+KMS 정식 전환 여부와 bucket lifecycle 정책.
- Toss 테스트/운영 키, 웹훅 URL, webhook secret 등록.
- 실제 토스 staging webhook을 raw body signature로 1회 e2e 검증.
- 메일 발신 도메인, SPF, DKIM, bounce/complaint 처리 정책.
- 운영 채널에서 `smtp_dry_run`이 실제 발송이 아님을 충분히 노출할 방법.
- ClamAV/OCR/PDF watermark 운영 방식.
- admin IP allowlist와 관리자 감사 로그 보존 기간.
- admin reason 회귀 테스트를 staging 배포 체크리스트에 포함.
- 운영 `LOCAL_STORAGE_SECRET`을 auth secret과 별도 secret으로 등록.
