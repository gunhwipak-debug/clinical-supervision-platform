# OPS Smoke Report

Generated: 2026-05-22T22:01:43.197Z

| Status | Check | Message |
| --- | --- | --- |
| ⚠ warn | db_configuration | DATABASE_URL이 없어 운영 DB 연결은 건너뜁니다. |
| ⚠ warn | role_split | DATABASE_URL 또는 SERVICE_DATABASE_URL이 없어 role 분리 검증을 건너뜁니다. |
| ⚠ warn | admin_ip_allowlist | ADMIN_IP_ALLOWLIST가 없어 개발 환경에서는 관리자 콘솔 네트워크 제한을 건너뜁니다. |
| ⚠ skipped | pgcrypto_roundtrip | DB 연결 정보가 없어 건너뜁니다. |
| ✓ ok | storage_adapter | LocalStorageAdapter 설정 확인 완료. |
| ✗ fail | google_calendar | 예약 시스템은 구글 캘린더 OAuth가 필수입니다. GOOGLE_CALENDAR_CLIENT_ID와 GOOGLE_CALENDAR_CLIENT_SECRET이 없으면 슈퍼바이저 OAuth, FreeBusy 충돌 제외, 예약 이벤트 생성/변경/삭제를 보장할 수 없어 배포 준비 상태가 아닙니다. |
| ⚠ warn | toss_adapter | TOSS_MODE must be set to dev or prod |
| ✓ ok | mailer_config | DevConsoleMailer 설정 확인 완료. |
| ⚠ skipped | purge_dry_run | DB 연결 정보가 없어 건너뜁니다. |
