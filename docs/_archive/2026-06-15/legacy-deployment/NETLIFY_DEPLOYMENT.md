# Netlify 배포 가이드

작성일: 2026-05-23  
대상: ClinicFlow 공개 웹 앱 (`apps/web`)  
관리자 콘솔: 별도 Netlify site로 분리 배포 권장

## 1. 중요한 전제

이 프로젝트는 Next.js App Router, API route, 서버 렌더링, 결제/예약/파일 처리 API를 사용한다. 따라서 Netlify에 단순 정적 파일 drag-and-drop 방식으로 올리면 안 된다.

반드시 Netlify가 빌드를 실행하도록 다음 중 하나로 배포한다.

- GitHub/GitLab/Bitbucket repository 연결 후 Netlify build
- Netlify CLI의 build 포함 deploy

루트 `netlify.toml`은 공개 웹 앱(`apps/web`) 배포용으로 설정되어 있다.

## 2. 추가된 배포 설정

기본 공개 웹 앱:

- 설정 파일: `netlify.toml`
- 빌드 명령: `pnpm --filter @csp/web build`
- publish directory: `apps/web/.next`
- Next.js 런타임: `@netlify/plugin-nextjs`

관리자 콘솔용 참고 설정:

- 설정 파일: `netlify.admin.toml`
- 빌드 명령: `pnpm --filter @csp/admin build`
- publish directory: `apps/admin/.next`
- 반드시 별도 사이트와 접근 제한으로 배포한다.

## 3. Netlify 대시보드 설정

공개 웹 앱을 Netlify에 연결할 때:

1. 프로젝트 repository를 연결한다.
2. base directory는 `Projects/ClinicalSupervisionPlatform`을 기준으로 잡는다. repository root가 이미 이 폴더라면 비워둔다.
3. build command와 publish directory는 `netlify.toml`을 사용한다.
4. package manager는 pnpm이다. `packageManager`는 `pnpm@11.1.2`로 고정되어 있다.
5. environment variables를 아래 표 기준으로 입력한다.

## 4. 필수 환경변수

운영/파일럿 배포에서 필수:

```bash
NODE_ENV=production
DATABASE_URL=postgres://...
SERVICE_DATABASE_URL=postgres://...
PHI_ENCRYPTION_KEY=...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_WEB_URL=https://your-netlify-site.netlify.app
NEXT_PUBLIC_ADMIN_URL=https://your-admin-site.netlify.app

GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=https://your-netlify-site.netlify.app/api/me/google-calendar/callback

STORAGE_MODE=supabase 또는 s3
CASE_FILES_BUCKET=case-files
QUALIFICATIONS_BUCKET=qualifications
COMPLETION_RECORDS_BUCKET=completion-records

TOSS_MODE=prod
TOSS_CLIENT_KEY=...
TOSS_SECRET_KEY=...
TOSS_WEBHOOK_SECRET=...
TOSS_API_BASE_URL=https://api.tosspayments.com

MAILER_MODE=resend
MAIL_FROM="ClinicFlow <no-reply@your-domain.example>"
RESEND_API_KEY=...
```

관리자 콘솔 site에는 추가로 아래가 필요하다.

```bash
ADMIN_IP_ALLOWLIST=...
NEXT_PUBLIC_ADMIN_URL=https://your-admin-site.netlify.app
```

## 5. Google Calendar 설정

Google Cloud Console OAuth client에 다음 redirect URI를 등록한다.

```text
https://your-netlify-site.netlify.app/api/me/google-calendar/callback
```

커스텀 도메인을 붙이면 redirect URI도 커스텀 도메인 기준으로 바꾼다.

예약 시스템은 Google Calendar가 필수다.

- OAuth 설정이 없으면 `calendar_config_required`
- 슈퍼바이저 연결이 없으면 `calendar_not_connected`
- 재인증이 필요하면 `calendar_reauth_required`
- Google Calendar 확인이 실패하면 `calendar_sync_failed`

이 상태에서는 일정 예약 상품 예약/재예약이 확정되지 않는다.

## 6. 배포 전 로컬 검증

```bash
cd /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform
pnpm typecheck
pnpm test apps/web/src/lib/supervision/supervision.integration.test.ts -- --runInBand
pnpm build
pnpm ops:smoke
```

현재 로컬에 Google OAuth 값이 없으면 `pnpm ops:smoke`는 실패하는 것이 정상이다. Netlify 환경변수까지 입력한 뒤에는 Google 항목이 통과해야 한다.

## 7. Netlify CLI로 배포할 경우

Netlify CLI를 쓰는 경우:

```bash
cd /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform
pnpm dlx netlify-cli deploy --build
pnpm dlx netlify-cli deploy --build --prod
```

관리자 콘솔을 별도 site로 배포할 때는 `netlify.admin.toml`을 명시한다.

```bash
pnpm dlx netlify-cli deploy --build --config netlify.admin.toml
```

## 8. 배포 후 확인할 화면

공개 웹 앱:

- `/`
- `/signup`
- `/login`
- `/supervisors`
- `/supervisors/[id]`
- `/requests`
- `/requests/new`
- `/settings`
- `/supervisor/availability`

관리자 site:

- `/admin`
- `/admin/qualifications`
- `/admin/refunds`
- `/admin/payouts`
- `/admin/audit`

## 9. 아직 배포 전 주의할 점

- PGlite 데모 DB는 Netlify 운영 배포에 쓰면 안 된다.
- `STORAGE_MODE=local`은 Netlify 함수 환경에서 운영용으로 쓰면 안 된다. Supabase Storage 또는 S3를 사용한다.
- Google Calendar OAuth 값 없이 예약 기능을 열면 안 된다.
- 관리자 콘솔은 공개 웹 앱과 같은 사이트에 섞지 않는다.
- Toss webhook URL과 Google redirect URI는 Netlify 배포 URL 기준으로 다시 등록한다.
- 현재 관리자 감사 로그, 환불 idempotency, 정산 지급 운영은 아직 P0 보강 대상이다. 자세한 내용은 `docs/ANTIGRAVITY_HANDOFF.md`를 확인한다.
