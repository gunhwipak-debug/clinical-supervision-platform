# Local Demo Decisions

## PGlite

로컬 데모는 Docker, Supabase, 외부 Postgres 없이 실행되어야 하므로 PGlite 파일 DB를
`./dev-data/pglite/`에 둔다. `DEV_DB=pglite`일 때만 `packages/db/src/client.ts`가
postgres-js 대신 `@electric-sql/pglite`와 `drizzle-orm/pglite`를 사용한다. 운영 경로는
기존 `DATABASE_URL` 기반 postgres-js 연결을 그대로 사용한다.

## Migration Runner

`pnpm demo:setup`은 `0000`부터 `0011`까지 적용하고 `demo_migrations` 테이블로 멱등성을
관리한다. PGlite는 `@electric-sql/pglite/contrib/pgcrypto`를 로드해
`CREATE EXTENSION pgcrypto`와 `pgp_sym_encrypt/decrypt` 라운드트립을 지원한다.
`CREATE ROLE`, `GRANT`, `ALTER DEFAULT PRIVILEGES`는 먼저 시도하고, PGlite 버전에 따라
실패하면 dev infra statement로 기록 후 건너뛰도록 했다.

## pgcrypto Limit

PHI 암호화 helper나 DB 함수는 stub으로 바꾸지 않는다. dev DB도 pgcrypto contrib를 사용하므로
case packet PHI 쓰기와 복호화까지 로컬 데모에서 확인한다. 만약 특정 환경에서 contrib 로딩이
깨지면 데모는 setup 단계에서 실패하도록 두고, 실제 Postgres 경로로 검증한다.

## Cookie Security

브라우저는 `http://localhost`에서 `Secure` 쿠키를 저장하지 않으므로
`apps/web/src/lib/auth/session.ts`의 `sessionCookieOptions()`만
`NODE_ENV === "production"`일 때 `secure: true`가 되도록 분기했다. production 빌드와
운영 환경에서는 secure 쿠키가 유지된다.

## Runtime Roles

PGlite 모드의 `createDatabase`, web runtime DB, service DB는 같은 파일 DB 인스턴스를
공유한다. PGlite는 실제 Supabase의 `csp_app`/`service_role` 연결 분리를 완전히 재현하지
않으므로 demo 문서에 superuser 파일 DB 한계를 명시한다. SQL RLS 정책과 `withUserContext`
GUC 설정 코드는 그대로 적용되어 운영 Postgres에서는 기존 권한 모델로 돌아간다.

## web/admin Runtime DB 분리

PGlite 파일 디렉터리는 여러 Node 프로세스가 동시에 열 때 초기화 실패가 날 수 있다.
`pnpm demo:setup`은 기준 시드 DB를 `dev-data/pglite`에 만들고, `pnpm demo:dev`는 시작 시
이를 `dev-data/pglite-web`, `dev-data/pglite-admin`으로 복사해 각 Next 프로세스가 자기
파일만 열게 한다. Flow A 자동 시나리오는 web 흐름과 admin 승인 흐름이 독립적으로 검증되므로
운영 RLS/PHI 정책을 약화하지 않는다. 실제 Postgres/Supabase로 옮기면 이 분기는 자동으로
사라진다.

## Operations Handoff

운영 환경으로 이관할 때 자동으로 풀리는 부분은 `DEV_DB`를 끄면 postgres-js 경로가 다시
사용된다는 점이다. 추가 작업이 필요한 부분은 실제 Postgres/Supabase 마이그레이션 적용,
`csp_app` 비밀번호 주입, pgcrypto 기반 PHI 쓰기 확인, service_role secret 분리, 도메인과
HTTPS 쿠키 검증이다.
