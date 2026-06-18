# Screenshot Manifest

Generated: 2026-06-18T00:26:09.972Z
Viewport: 1440x1000

## Summary

- Expected routes: 44
- Captured screenshots: 44
- PASS: 39
- PASS WITH MINOR ISSUES: 0
- INTENTIONALLY REDIRECTED: 5
- BROKEN: 0

## Notes

- `net::ERR_ABORTED` requests with `_rsc=` were treated as Next.js prefetch cancellations, not route failures.

| # | App | Group | Route | Final URL | Verdict | Screenshot | H1 | Notes |
|---:|---|---|---|---|---|---|---|---|
| 1 | web | Public | `/` | http://localhost:3000/ | PASS | [screenshots/01-public-home.png](screenshots/01-public-home.png) | 슈퍼비전 의뢰와 피드백을 한곳에서 | captured and rendered |
| 2 | web | Public | `/supervisors` | http://localhost:3000/supervisors | PASS | [screenshots/02-public-supervisors.png](screenshots/02-public-supervisors.png) | 슈퍼바이저를 비교하고 선택하세요 | ignored RSC prefetch aborts=3 |
| 3 | web | Public | `/supervisors/[id]` | http://localhost:3000/supervisors/10000000-0000-4000-8000-000000000105 | PASS | [screenshots/03-public-supervisors-id.png](screenshots/03-public-supervisors-id.png) | 신경심리 해석 파트너 | captured and rendered |
| 4 | web | Public | `/guide` | http://localhost:3000/guide | PASS | [screenshots/04-public-guide.png](screenshots/04-public-guide.png) | 슈퍼비전 신청부터 기록까지 한 흐름으로 | captured and rendered |
| 5 | web | Public | `/resources` | http://localhost:3000/resources | PASS | [screenshots/05-public-resources.png](screenshots/05-public-resources.png) | 의뢰 전에 필요한 기준만 확인합니다 | captured and rendered |
| 6 | web | Public | `/clinical-guidelines` | http://localhost:3000/clinical-guidelines | PASS | [screenshots/06-public-clinical-guidelines.png](screenshots/06-public-clinical-guidelines.png) | 임상 가이드라인 | captured and rendered |
| 7 | web | Public | `/terms` | http://localhost:3000/terms | PASS | [screenshots/07-public-terms.png](screenshots/07-public-terms.png) | 서비스 이용약관 | captured and rendered |
| 8 | web | Public | `/privacy` | http://localhost:3000/privacy | PASS | [screenshots/08-public-privacy.png](screenshots/08-public-privacy.png) | 개인정보 처리방침 | captured and rendered |
| 9 | web | Public | `/security` | http://localhost:3000/security | PASS | [screenshots/09-public-security.png](screenshots/09-public-security.png) | 보안 기준 | captured and rendered |
| 10 | web | Public | `/sensitive-consent` | http://localhost:3000/sensitive-consent | PASS | [screenshots/10-public-sensitive-consent.png](screenshots/10-public-sensitive-consent.png) | 민감정보 처리 동의 | captured and rendered |
| 11 | web | Auth | `/login` | http://localhost:3000/login | PASS | [screenshots/11-auth-login.png](screenshots/11-auth-login.png) | 내 슈퍼비전 현황을 확인합니다 | captured and rendered |
| 12 | web | Auth | `/signup` | http://localhost:3000/signup | PASS | [screenshots/12-auth-signup.png](screenshots/12-auth-signup.png) | ClinicFlow 계정 만들기 | captured and rendered |
| 13 | web | Auth | `/forgot-password` | http://localhost:3000/forgot-password | PASS | [screenshots/13-auth-forgot-password.png](screenshots/13-auth-forgot-password.png) | 비밀번호 재설정 | captured and rendered |
| 14 | web | Auth | `/reset-password` | http://localhost:3000/reset-password | PASS | [screenshots/14-auth-reset-password.png](screenshots/14-auth-reset-password.png) | 새 비밀번호 설정 | captured and rendered |
| 15 | web | Auth | `/email/verify` | http://localhost:3000/email/verify | PASS | [screenshots/15-auth-email-verify.png](screenshots/15-auth-email-verify.png) | 이메일 확인 | captured and rendered |
| 16 | web | Auth | `/verify-email` | http://localhost:3000/email/verify | INTENTIONALLY REDIRECTED | [screenshots/16-auth-verify-email.png](screenshots/16-auth-verify-email.png) | 이메일 확인 | intentional alias/redirect to /email/verify |
| 17 | web | Supervisee | `/requests` | http://localhost:3000/requests | PASS | [screenshots/17-supervisee-requests.png](screenshots/17-supervisee-requests.png) | 내 슈퍼비전 의뢰 | captured and rendered |
| 18 | web | Supervisee | `/requests/new` | http://localhost:3000/requests/new | PASS | [screenshots/18-supervisee-requests-new.png](screenshots/18-supervisee-requests-new.png) | 새 슈퍼비전 의뢰 | captured and rendered |
| 19 | web | Supervisee | `/requests/[id]` | http://localhost:3000/requests/10000000-0000-4000-8000-000000000607 | PASS | [screenshots/19-supervisee-requests-id.png](screenshots/19-supervisee-requests-id.png) | 의뢰 상세 | captured and rendered |
| 20 | web | Supervisee | `/payments` | http://localhost:3000/payments | PASS | [screenshots/20-supervisee-payments.png](screenshots/20-supervisee-payments.png) | 결제 내역 | captured and rendered |
| 21 | web | Supervisee | `/payments/[id]` | http://localhost:3000/payments/10000000-0000-4000-8000-000000000701 | PASS | [screenshots/21-supervisee-payments-id.png](screenshots/21-supervisee-payments-id.png) | 결제 상세 | captured and rendered |
| 22 | web | Supervisee | `/payments/confirm` | http://localhost:3000/payments/confirm | PASS | [screenshots/22-supervisee-payments-confirm.png](screenshots/22-supervisee-payments-confirm.png) | 결제 결과 확인 | captured and rendered |
| 23 | web | Supervisee | `/case-archive` | http://localhost:3000/case-archive | PASS | [screenshots/23-supervisee-case-archive.png](screenshots/23-supervisee-case-archive.png) | 케이스 아카이브 | captured and rendered |
| 24 | web | Supervisee | `/notifications` | http://localhost:3000/notifications | PASS | [screenshots/24-supervisee-notifications.png](screenshots/24-supervisee-notifications.png) | 알림 | captured and rendered |
| 25 | web | Supervisee | `/settings` | http://localhost:3000/settings | PASS | [screenshots/25-supervisee-settings.png](screenshots/25-supervisee-settings.png) | 계정 설정 | captured and rendered |
| 26 | web | Supervisor | `/supervisor` | http://localhost:3000/supervisor | PASS | [screenshots/26-supervisor-supervisor.png](screenshots/26-supervisor-supervisor.png) | 정확한 평가 전문가 | captured and rendered |
| 27 | web | Supervisor | `/supervisor/requests` | http://localhost:3000/supervisor/requests | PASS | [screenshots/27-supervisor-supervisor-requests.png](screenshots/27-supervisor-supervisor-requests.png) | 검토할 의뢰 | captured and rendered |
| 28 | web | Supervisor | `/supervisor/requests/[id]` | http://localhost:3000/supervisor/requests/10000000-0000-4000-8000-000000000601 | PASS | [screenshots/28-supervisor-supervisor-requests-id.png](screenshots/28-supervisor-supervisor-requests-id.png) | 종합심리평가 보고서 검토 | captured and rendered |
| 29 | web | Supervisor | `/supervisor/profile` | http://localhost:3000/supervisor/profile | PASS | [screenshots/29-supervisor-supervisor-profile.png](screenshots/29-supervisor-supervisor-profile.png) | 슈퍼바이저 프로필 | captured and rendered |
| 30 | web | Supervisor | `/supervisor/products` | http://localhost:3000/supervisor/products | PASS | [screenshots/30-supervisor-supervisor-products.png](screenshots/30-supervisor-supervisor-products.png) | 슈퍼비전 방식 | captured and rendered |
| 31 | web | Supervisor | `/supervisor/availability` | http://localhost:3000/supervisor/availability | PASS | [screenshots/31-supervisor-supervisor-availability.png](screenshots/31-supervisor-supervisor-availability.png) | 일정 관리 | captured and rendered |
| 32 | web | Supervisor | `/supervisor/memory` | http://localhost:3000/supervisor/memory | PASS | [screenshots/32-supervisor-supervisor-memory.png](screenshots/32-supervisor-supervisor-memory.png) | 기록 폴더 | captured and rendered |
| 33 | web | Supervisor | `/supervisor/payouts` | http://localhost:3000/supervisor/payouts | PASS | [screenshots/33-supervisor-supervisor-payouts.png](screenshots/33-supervisor-supervisor-payouts.png) | 정산 내역 | captured and rendered |
| 34 | web | Supervisor | `/supervisor/qualifications` | http://localhost:3000/supervisor/qualifications | PASS | [screenshots/34-supervisor-supervisor-qualifications.png](screenshots/34-supervisor-supervisor-qualifications.png) | 자격 심사 | captured and rendered |
| 35 | web | Supervisor | `/me` | http://localhost:3000/supervisor | INTENTIONALLY REDIRECTED | [screenshots/35-supervisor-me.png](screenshots/35-supervisor-me.png) | 정확한 평가 전문가 | intentional alias/redirect to /supervisor |
| 36 | admin | Admin | `/` | http://localhost:3001/admin | INTENTIONALLY REDIRECTED | [screenshots/36-admin-home.png](screenshots/36-admin-home.png) | 운영 처리 목록 | intentional alias/redirect to /admin |
| 37 | admin | Admin | `/admin` | http://localhost:3001/admin | PASS | [screenshots/37-admin-admin.png](screenshots/37-admin-admin.png) | 운영 처리 목록 | captured and rendered |
| 38 | admin | Admin | `/admin/queue` | http://localhost:3001/admin/queue | PASS | [screenshots/38-admin-admin-queue.png](screenshots/38-admin-admin-queue.png) | 대기열 | captured and rendered |
| 39 | admin | Admin | `/admin/qualifications` | http://localhost:3001/admin/qualifications | PASS | [screenshots/39-admin-admin-qualifications.png](screenshots/39-admin-admin-qualifications.png) | 자격 심사 | captured and rendered |
| 40 | admin | Admin | `/admin/refunds` | http://localhost:3001/admin/refunds | PASS | [screenshots/40-admin-admin-refunds.png](screenshots/40-admin-admin-refunds.png) | 환불 | captured and rendered |
| 41 | admin | Admin | `/admin/payouts` | http://localhost:3001/admin/payouts | PASS | [screenshots/41-admin-admin-payouts.png](screenshots/41-admin-admin-payouts.png) | 정산 | captured and rendered |
| 42 | admin | Admin | `/admin/audit` | http://localhost:3001/admin/audit | PASS | [screenshots/42-admin-admin-audit.png](screenshots/42-admin-admin-audit.png) | 감사 로그 | captured and rendered |
| 43 | admin | Admin | `/payouts` | http://localhost:3001/admin/payouts | INTENTIONALLY REDIRECTED | [screenshots/43-admin-payouts.png](screenshots/43-admin-payouts.png) | 정산 | intentional alias/redirect to /admin/payouts |
| 44 | admin | Admin | `/refunds` | http://localhost:3001/admin/refunds | INTENTIONALLY REDIRECTED | [screenshots/44-admin-refunds.png](screenshots/44-admin-refunds.png) | 환불 | intentional alias/redirect to /admin/refunds |
