# Supabase Seoul Setup

EPIC 0의 `T-003 Supabase Seoul 프로젝트·KMS·Storage 버킷 생성`을 실제 계정에서 완료하기 위한 체크리스트입니다.

## 1. 프로젝트

1. Supabase Dashboard에서 새 프로젝트를 생성합니다.
2. Region은 Seoul을 선택합니다.
3. Database password를 안전한 비밀관리 도구에 저장합니다.
4. `.env.local`의 `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`를 채웁니다.

## 2. Storage buckets

다음 bucket을 생성합니다.

- `case-files`: 케이스 패킷 첨부파일. Public disabled.
- `qualifications`: 자격증/증빙 파일. Public disabled.
- `completion-records`: 완료 기록서 PDF 및 서명 스냅샷. Public disabled.

모든 bucket은 서버 측 암호화를 켜고, Public URL을 비활성화합니다. signed URL은 서버 API에서 짧은 TTL로만 발급합니다.
EPIC 5 로컬 데모는 `LOCAL_STORAGE_DIR=./dev-data/storage`의 파일 어댑터를 사용하지만,
운영 전환 시 같은 `StorageAdapter` 계약을 Supabase Storage 또는 S3 어댑터로 교체합니다.
운영 pilot은 `STORAGE_MODE=supabase`, `SUPABASE_STORAGE_BUCKET=case-files`로 시작할
수 있으며, 정식 출시 전 대용량 파일·KMS·감사 요구가 커지면 `STORAGE_MODE=s3`와
AWS Seoul + KMS 전환을 재검토합니다. 두 모드 모두 서버 API가 짧은 signed token을
발급하고 서버가 객체를 읽고 쓰는 구조를 유지해 service role 또는 S3 secret을
브라우저에 노출하지 않습니다.
`case-files` 다운로드는 서버 API가 15분 signed URL을 발급하고 `access_logs.signed_url_id`를
남기는 경로를 유지해야 합니다.
보관기간이 지난 파일은 운영 스케줄러가 `pnpm files:purge-expired`를 호출해
스토리지 객체를 삭제하고 `case_files.deleted_at`을 기록합니다. 운영 전에는
`pnpm files:purge-expired -- --dry-run`으로 대상 목록을 먼저 확인합니다.
ClamAV, OCR 기반 PDF/이미지 PHI scan, HWP/HWPX·Office 본문 추출, true PDF
watermark는 아직 운영 어댑터에 포함되지 않았습니다. 강제 익명화와 OCR은
후속 hardening으로 미루며, 출시 전 사용자 문구에서 “자동 익명화 완료”처럼
오해될 표현은 제거합니다. 법률 검토 필요.

베타 파일 정책은 EPIC 5 증빙 포맷을 허용합니다. `case-files` 업로드는 text,
PDF, PNG/JPG/WEBP, HWP/HWPX, DOCX/XLSX를 허용하고, 실행 파일·압축 파일·disk
image·알 수 없는 binary·MIME/확장자 mismatch는 `unsupported_file_type`으로
차단합니다. 비텍스트 파일은 내부 preview/annotation과 supervisor review에는
사용할 수 있지만, OCR/본문 PHI scan이 완료된 파일로 취급하지 않습니다.

Assessment 완료는 feedback approval 후 completion record를 발행하고 stamped
return을 남기는 흐름입니다. stamped assessment completion 이후 raw case files는
7일 뒤 purge 대상이 되며, counseling supervision은 assessment stamp 없이
feedback completion으로 종료할 수 있습니다.

## 3. Database migrations

```bash
pnpm --filter @csp/db drizzle:check
pnpm --filter @csp/db exec drizzle-kit migrate --config drizzle.config.ts
```

`0002_app_role_and_fixes.sql`는 애플리케이션 런타임용 DB role인
`csp_app`을 생성합니다. 이 role은 `NOSUPERUSER`, `NOBYPASSRLS`이며 앱 서버의
`DATABASE_URL`은 반드시 `csp_app`을 사용합니다. Supabase `service_role` 또는
Postgres owner/superuser 연결 문자열은 시스템 워커, 마이그레이션, 운영 배치처럼
명시적으로 RLS 우회를 요구하는 서버 전용 경로에서만 사용합니다.

마이그레이션 적용 후 `csp_app` 비밀번호를 별도 비밀관리 도구에 저장하고
런타임 연결 문자열을 교체합니다.

```sql
alter role csp_app with password 'replace-with-strong-password';
```

`.env.local` 예시:

```bash
DATABASE_URL=postgres://csp_app:<password>@<host>:5432/postgres
SERVICE_DATABASE_URL=postgres://postgres:<service-password>@<host>:5432/postgres
```

회원가입은 `service_role`을 사용하는 백엔드 라우트에서만 처리합니다.
`users_context_insert` 정책은 인증된 컨텍스트에서 자기 사용자 행을 보호하는 경로로
두며, 공개 클라이언트나 `csp_app` 런타임이 임의 회원가입을 직접 처리하지 않습니다.
시스템 cron/워커가 `audit_logs` 또는 `access_logs`에 기록할 때도 서버 전용
`service_role` 경로를 사용하고, `access_logs.signed_url_id` 등 추적 가능한 메타를
채워 운영 감사가 이어지게 합니다.

마이그레이션 후 확인합니다.

```sql
select tablename, rowsecurity, force_row_security
from pg_tables
where schemaname = 'public'
order by tablename;
```

RLS 정책이 올라왔는지도 확인합니다.

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and policyname in (
    'users_context_insert',
    'completion_records_participant_select',
    'completion_records_supervisor_insert',
    'completion_records_supervisor_update',
    'reviews_supervisee_insert'
  )
order by tablename, policyname;
```

`pgcrypto` 통합 테스트는 docker postgres + `DOCKER_PG=1` 환경에서만 실행합니다.
예시: `docker run --rm -d -e POSTGRES_PASSWORD=postgres -p 54322:5432 postgres:16`
(`pgcrypto`는 기본 포함).

## 4. Required secrets

- `PHI_ENCRYPTION_KEY`: 32자 이상 고엔트로피 값
- `BETTER_AUTH_SECRET`: 32자 이상 고엔트로피 값
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용. 브라우저 노출 금지

PHI 운영 규칙:

- `PHI_ENCRYPTION_KEY`는 런타임 secret manager에서만 주입합니다.
- `withUserContext(..., { phiAccess: true })`가 필요한 요청에서만
  `app.phi_key` GUC를 설정합니다.
- DB 로그에 GUC 값이 남지 않도록 운영 DB는 `log_statement = 'none'`을 권장합니다.
- 장애 분석 시에도 PHI 복호화 쿼리와 `set_config('app.phi_key', ...)` 호출을 로그에
  남기지 않습니다.

## 5. Launch gate notes

Supabase Storage의 객체 단위 KMS 제어는 AWS S3 + KMS보다 제한적입니다. 파일럿은 Supabase Storage로 시작하되, 정식 출시 전 `case-files`와 `completion-records`는 AWS S3 Seoul + KMS 이관 여부를 재검토합니다.

결제 운영 전환 시 `.env.local`에서 `TOSS_MODE=prod`로 바꾸기 전에 토스 테스트
클라이언트 키, 시크릿 키, 웹훅 시크릿을 운영 비밀관리 도구에 등록합니다. 현재
코드의 prod 어댑터는 fetch 주입형 골격을 포함하지만, 실제 토스 콘솔에서 웹훅 URL과
테스트/운영 키를 등록한 뒤 mock 없는 e2e 승인 테스트를 완료해야 합니다.

운영 전환 smoke:

```bash
pnpm ops:smoke
```

이 스크립트는 DB/pgcrypto, runtime/service role 분리, Storage/Toss/Mailer 설정,
만료 파일 purge dry-run을 점검하고 `demo-evidence/OPS-REPORT.md`에 결과를 남깁니다.
credential이 아직 없는 항목은 warn 또는 skipped로 표시합니다.

실 Postgres/Supabase 이관 smoke:

```bash
DATABASE_URL='postgres://csp_app:...' \
SERVICE_DATABASE_URL='postgres://service_role_or_owner:...' \
PHI_ENCRYPTION_KEY='...' \
pnpm ops:db-smoke
```

`pnpm ops:db-smoke`는 로컬 PGlite가 아니라 실제 Postgres 연결을 대상으로 다음을
read-only로 점검합니다: runtime role이 `csp_app`이고 superuser/BYPASSRLS가 아닌지,
service role과 runtime URL이 분리되어 있는지, `pgcrypto`와 `app.*` helper 함수가
동작하는지, 핵심 테이블과 RLS가 적용되어 있는지, GUC 컨텍스트가 없을 때 `users`
SELECT가 0건인지, 샘플 사용자 self context SELECT가 통과하는지, `phiAccess=true`
컨텍스트에서 `app.phi_key` roundtrip이 되는지 확인합니다. 결과는
`demo-evidence/REAL-DB-SMOKE.md`와 `demo-evidence/real-db-smoke.json`에 남습니다.
앱 테이블에는 쓰지 않으며, `OPS_DB_SMOKE_WRITE=1`을 추가한 경우에만 `pg_temp`
임시 테이블 write probe를 수행합니다.
