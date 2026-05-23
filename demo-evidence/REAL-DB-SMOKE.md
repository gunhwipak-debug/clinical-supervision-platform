# Real DB Smoke Report

Generated: 2026-05-22T04:04:19.472Z

Mode: real-postgres-read-only

Write probe enabled: no

Runtime URL: not configured

Service URL: not configured

| Status | Check | Message |
| --- | --- | --- |
| ⚠ warn | db_url_presence | DATABASE_URL/SERVICE_DATABASE_URL이 없어 실 DB smoke를 설정 점검 모드로만 실행했습니다. |
| ⚠ skipped | db_url_split | 두 DB URL 중 하나가 없어 분리 검증을 건너뜁니다. |
| ⚠ skipped | runtime_role | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | service_role | SERVICE_DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | pgcrypto_roundtrip | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | app_helpers | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | migration_presence | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | rls_enabled | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | no_context_users_select | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | self_context_users_select | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | phi_guc_roundtrip | DATABASE_URL이 없어 건너뜁니다. |
| ⚠ skipped | temp_write_probe | DATABASE_URL이 없어 건너뜁니다. |

## Notes

- 이 스크립트는 기본적으로 앱 테이블에 쓰지 않습니다.
- `OPS_DB_SMOKE_WRITE=1`을 설정하면 `pg_temp` 임시 테이블 write probe만 수행합니다.
- credential 미설정은 실패가 아니라 warn/skipped로 기록합니다.
