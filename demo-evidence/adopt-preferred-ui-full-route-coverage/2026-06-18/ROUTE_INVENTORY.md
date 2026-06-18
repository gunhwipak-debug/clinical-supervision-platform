# Route Inventory

Generated: 2026-06-17T23:58:31.285Z

## Summary

- Expected canonical inventory: 44
- Actual page templates found: 44
- Canonical pages: 39
- Alias/redirect pages: 5
- Missing pages: 0
- Web app routes: 35
- Admin app routes: 9

The previous 35-page screenshot set was caused by capture scope, not route loss: it captured the web app surface and omitted the 9 admin app route surfaces. Some alias routes also require explicit capture because they redirect to canonical pages.

## Matrix

| # | App | Expected path | Status | Template | Auth/role | Actual file | Alias target |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | web | `/` | OK | PublicLanding | public | `apps/web/src/app/page.tsx` |  |
| 2 | web | `/supervisors` | OK | PublicDirectory | public | `apps/web/src/app/(public)/supervisors/page.tsx` |  |
| 3 | web | `/supervisors/[id]` | OK | PublicDetail | public | `apps/web/src/app/(public)/supervisors/[id]/page.tsx` |  |
| 4 | web | `/guide` | OK | PublicLanding | public | `apps/web/src/app/(public)/guide/page.tsx` |  |
| 5 | web | `/resources` | OK | PublicLanding | public | `apps/web/src/app/(public)/resources/page.tsx` |  |
| 6 | web | `/clinical-guidelines` | OK | LegalStatic | public | `apps/web/src/app/(public)/clinical-guidelines/page.tsx` |  |
| 7 | web | `/terms` | OK | LegalStatic | public | `apps/web/src/app/(public)/terms/page.tsx` |  |
| 8 | web | `/privacy` | OK | LegalStatic | public | `apps/web/src/app/(public)/privacy/page.tsx` |  |
| 9 | web | `/security` | OK | LegalStatic | public | `apps/web/src/app/(public)/security/page.tsx` |  |
| 10 | web | `/sensitive-consent` | OK | LegalStatic | public | `apps/web/src/app/(public)/sensitive-consent/page.tsx` |  |
| 11 | web | `/login` | OK | AuthForm | public | `apps/web/src/app/(auth)/login/page.tsx` |  |
| 12 | web | `/signup` | OK | AuthForm | public | `apps/web/src/app/(auth)/signup/page.tsx` |  |
| 13 | web | `/forgot-password` | OK | AuthForm | public | `apps/web/src/app/(auth)/forgot-password/page.tsx` |  |
| 14 | web | `/reset-password` | OK | AuthForm | public | `apps/web/src/app/(auth)/reset-password/page.tsx` |  |
| 15 | web | `/email/verify` | OK | AuthForm | public | `apps/web/src/app/(auth)/email/verify/page.tsx` |  |
| 16 | web | `/verify-email` | REDIRECT | LegacyAlias | public | `apps/web/src/app/(auth)/verify-email/page.tsx` | /email/verify |
| 17 | web | `/requests` | OK | SuperviseeDashboard | supervisee | `apps/web/src/app/(supervisee)/requests/page.tsx` |  |
| 18 | web | `/requests/new` | OK | TransactionWizard | supervisee | `apps/web/src/app/(supervisee)/requests/new/page.tsx` |  |
| 19 | web | `/requests/[id]` | OK | RequestDetail | supervisee | `apps/web/src/app/(supervisee)/requests/[id]/page.tsx` |  |
| 20 | web | `/payments` | OK | PaymentList | supervisee | `apps/web/src/app/(supervisee)/payments/page.tsx` |  |
| 21 | web | `/payments/[id]` | OK | PaymentDetail | supervisee | `apps/web/src/app/(supervisee)/payments/[id]/page.tsx` |  |
| 22 | web | `/payments/confirm` | OK | TransactionWizard | supervisee | `apps/web/src/app/(supervisee)/payments/confirm/page.tsx` |  |
| 23 | web | `/case-archive` | OK | RecordArchive | supervisee | `apps/web/src/app/(supervisee)/case-archive/page.tsx` |  |
| 24 | web | `/notifications` | OK | SuperviseeDashboard | supervisee | `apps/web/src/app/(supervisee)/notifications/page.tsx` |  |
| 25 | web | `/settings` | OK | Settings | supervisee | `apps/web/src/app/(supervisee)/settings/page.tsx` |  |
| 26 | web | `/supervisor` | OK | SupervisorDashboard | supervisor | `apps/web/src/app/(supervisor)/supervisor/page.tsx` |  |
| 27 | web | `/supervisor/requests` | OK | SupervisorQueue | supervisor | `apps/web/src/app/(supervisor)/supervisor/requests/page.tsx` |  |
| 28 | web | `/supervisor/requests/[id]` | OK | SupervisorReviewWorkspace | supervisor | `apps/web/src/app/(supervisor)/supervisor/requests/[id]/page.tsx` |  |
| 29 | web | `/supervisor/profile` | OK | SupervisorSettings | supervisor | `apps/web/src/app/(supervisor)/supervisor/profile/page.tsx` |  |
| 30 | web | `/supervisor/products` | OK | SupervisorSettings | supervisor | `apps/web/src/app/(supervisor)/supervisor/products/page.tsx` |  |
| 31 | web | `/supervisor/availability` | OK | SupervisorSettings | supervisor | `apps/web/src/app/(supervisor)/supervisor/availability/page.tsx` |  |
| 32 | web | `/supervisor/memory` | OK | RecordArchive | supervisor | `apps/web/src/app/(supervisor)/supervisor/memory/page.tsx` |  |
| 33 | web | `/supervisor/payouts` | OK | SupervisorLedger | supervisor | `apps/web/src/app/(supervisor)/supervisor/payouts/page.tsx` |  |
| 34 | web | `/supervisor/qualifications` | OK | SupervisorSettings | supervisor | `apps/web/src/app/(supervisor)/supervisor/qualifications/page.tsx` |  |
| 35 | web | `/me` | REDIRECT | LegacyAlias | authenticated | `apps/web/src/app/(supervisor)/me/page.tsx` | role-dependent canonical route |
| 36 | admin | `/admin` | OK | AdminConsole | admin | `apps/admin/src/app/admin/page.tsx` |  |
| 37 | admin | `/admin/queue` | OK | AdminTable | admin | `apps/admin/src/app/admin/queue/page.tsx` |  |
| 38 | admin | `/admin/qualifications` | OK | AdminTable | admin | `apps/admin/src/app/admin/qualifications/page.tsx` |  |
| 39 | admin | `/admin/refunds` | OK | AdminTable | admin | `apps/admin/src/app/admin/refunds/page.tsx` |  |
| 40 | admin | `/admin/payouts` | OK | AdminTable | admin | `apps/admin/src/app/admin/payouts/page.tsx` |  |
| 41 | admin | `/admin/audit` | OK | AdminTable | admin | `apps/admin/src/app/admin/audit/page.tsx` |  |
| 42 | admin | `/payouts` | REDIRECT | LegacyAlias | admin | `apps/admin/src/app/(admin)/payouts/page.tsx` | /admin/payouts |
| 43 | admin | `/refunds` | REDIRECT | LegacyAlias | admin | `apps/admin/src/app/(admin)/refunds/page.tsx` | /admin/refunds |
| 44 | admin | `/` | REDIRECT | LegacyAlias | admin | `apps/admin/src/app/page.tsx` | /admin |
