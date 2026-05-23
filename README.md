# ClinicFlow

한국 심리평가 슈퍼비전 마켓플레이스 MVP입니다. `codex-piped-quiche.md`의 EPIC 0을 기준으로 Next.js 15 monorepo, Drizzle schema, RLS migration, PHI 암호화 헬퍼를 먼저 부트스트랩했습니다.

## Quickstart (no Docker required)

```bash
pnpm install
pnpm demo:setup
pnpm demo:dev
```

브라우저에서 `http://localhost:3000`에 접속한 뒤
`supervisee@demo.local` / `DemoPass!23`로 로그인합니다. 슈퍼바이저 검색에서
`정확한 평가 전문가`를 선택하고 공개 캘린더의 시간대와 상품을 고르면 예약이
연결된 의뢰 초안을 만들 수 있습니다.
자동 검증은 dev 서버가 켜진 상태에서 별도 터미널로 `pnpm demo:run`을 실행합니다.
결과 가이드는 `demo-evidence/REPORT.md`에 생성됩니다.
로컬 파일 업로드는 `dev-data/storage`를 사용하며, 데모 흐름에서 clean 텍스트 파일
등록과 PHI 포함 파일 차단을 함께 확인합니다.
만료된 파일 정리는 `pnpm files:purge-expired -- --dry-run`으로 먼저 확인한 뒤
`pnpm files:purge-expired`를 실행합니다.
예약 전 알림은 운영 스케줄러에서 `pnpm notifications:session-reminders`를 주기적으로
호출해 발행합니다. 로컬에서는 `pnpm notifications:session-reminders -- --dry-run`으로
대상 세션을 먼저 확인할 수 있습니다.
자료 보존기간 만료 전 경고는 `pnpm notifications:retention-warnings`를 주기적으로
호출해 발행합니다. 로컬에서는 `pnpm notifications:retention-warnings -- --dry-run`으로
대상을 확인합니다.
결제나 제출 없이 방치된 예약 초안은 `pnpm bookings:expire-holds`가 만료 처리해
로컬 booking과 구글 캘린더 이벤트를 정리합니다. 로컬에서는
`pnpm bookings:expire-holds -- --dry-run`으로 먼저 확인합니다.
운영 전환 준비 상태는 `pnpm ops:smoke`로 확인하고, 결과는
`demo-evidence/OPS-REPORT.md`를 확인합니다. Supabase/S3/Toss/Mailer credential이
없는 항목은 warn/skip으로 분리해 표시합니다. 단, 예약 시스템은 구글 캘린더 OAuth가
필수이므로 `GOOGLE_CALENDAR_CLIENT_ID`와 `GOOGLE_CALENDAR_CLIENT_SECRET`이 없으면
`pnpm ops:smoke`가 실패합니다. 실제 FreeBusy/이벤트 동기화는 통합 테스트와 데모
여정 감사에서 검증합니다.

실제 메일 발송은 `MAILER_MODE=resend`를 사용합니다. 운영 환경에서는 아래 값을
설정해야 이메일 인증, 비밀번호 재설정, 예약/피드백 알림이 실제 메일로 전송됩니다.

```bash
MAILER_MODE=resend
MAIL_FROM="ClinicFlow <no-reply@your-domain.example>"
RESEND_API_KEY=...
```

Figma 변수까지 초기화하려면 빈 Figma 파일을 만든 뒤 `.env.local`에
`FIGMA_ACCESS_TOKEN`, `FIGMA_FILE_KEY`를 넣고 `pnpm figma:push`를 실행합니다.
토큰이 없으면 Figma 스크립트는 건너뛰며 로컬 데모는 그대로 동작합니다.

Netlify 배포는 `netlify.toml`을 사용합니다. 공개 웹 앱은 `apps/web`을 배포하고,
관리자 콘솔은 별도 Netlify site로 분리하세요. 자세한 환경변수와 배포 절차는
`docs/NETLIFY_DEPLOYMENT.md`를 확인합니다.

## 구글 캘린더 예약 연동

슈퍼바이저 일정 화면(`/supervisor/availability`)의 `구글 캘린더` 연동은 실제
OAuth, FreeBusy 조회, 예약 이벤트 생성, Meet 링크 저장, 일정 변경, 취소/거절/환불
시 이벤트 삭제까지 예약 흐름에 연결되어 있습니다. 운영 또는 실제 파일럿 환경에서는
`.env.local`에 아래 값을 설정한 뒤 구글 OAuth redirect URI를 웹 앱 callback으로
등록합니다.

```bash
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/me/google-calendar/callback
```

`GOOGLE_CALENDAR_REDIRECT_URI`를 비워두면 현재 origin의
`/api/me/google-calendar/callback`을 사용합니다. 구글 캘린더가 정상 연결되지 않은
슈퍼바이저는 일정 예약 상품을 받을 수 없습니다. 연결된 슈퍼바이저만 FreeBusy 충돌
제외, 이벤트 생성, Meet 링크 저장, 일정 변경 동기화까지 자동으로 처리됩니다. 연결된
구글 캘린더의 상태를 확인하지 못하면 충돌 방지를 위해 해당 예약/일정 변경은 확정하지
않습니다.

## 구조

- `apps/web`: 슈퍼바이지/슈퍼바이저용 웹 앱
- `apps/admin`: 운영자 콘솔
- `packages/db`: Drizzle schema, migration, DB user context helper
- `packages/shared`: PHI 암호화 등 공통 유틸
- `docs`: 운영/인프라 설정 문서

## 로컬 시작

```bash
pnpm install
cp .env.example .env.local
pnpm typecheck
pnpm lint
pnpm test
pnpm drizzle:check
pnpm dev:web
pnpm dev:admin
```

웹 앱은 `http://localhost:3000`, 관리자 앱은 `http://localhost:3001`을 사용합니다.

## EPIC 0 보안 규칙

- 임상자료 쿼리는 `packages/db/src/context.ts`의 `withUserContext`를 통해 트랜잭션 GUC를 설정한 뒤 실행합니다.
- PHI 컬럼은 pgcrypto 기반 `packages/shared/src/crypto/phi.ts` helper를 통해 암복호화 SQL을 생성합니다.
- `packages/db/drizzle/0001_rls_policies.sql`은 모든 주요 테이블에 RLS를 켜고, 임상자료 접근은 참여자 또는 사유가 있는 관리자만 허용합니다.
- 관리자 PHI 접근은 `app.admin_reason`이 30자 이상일 때만 활성화됩니다.

## Supabase 준비

실제 Supabase Seoul 프로젝트와 Storage bucket 생성은 계정 로그인/결제 카드가 필요하므로 코드에서 자동 실행하지 않았습니다. 절차는 `docs/supabase-setup.md`에 정리했습니다.
