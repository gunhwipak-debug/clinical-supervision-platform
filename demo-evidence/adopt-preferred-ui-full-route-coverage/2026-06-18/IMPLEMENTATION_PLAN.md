# Implementation Plan

## Tier

HEAVY. Facts: the request spans preferred UI adoption, route inventory, 44-route browser capture, public/auth/supervisee/supervisor/admin shells, reports, rollback, and verification. Forbidden higher-risk domains are explicitly excluded: auth/session policy, payment provider logic, DB schema, backend expansion, PDF/case-files, mobile optimization.

## Preferred UI Version Identified

Preferred structure is the current StyleSeed-informed / Workbench v2 experiment state on this branch: compact desktop app chrome, grouped sidebar role navigation, compact page headers, top status bars for static metadata, row/table/list-first operational pages, form-first auth, restrained radius/shadow, one ClinicFlow blue accent. Evidence source: `demo-evidence/styleseed-heavy-reconstruction/2026-06-18/FINAL_REPORT.md` and the current dirty source files now preserved on `adopt/preferred-ui-structure-full-route-coverage`.

## Expected Vs Actual Route Coverage

Expected: 44. Actual page templates found: 44. Missing: 0. Alias/redirect: 5.

## Why 35 Pages Appeared

The 35-page set was a capture script scope issue. The web app has 35 route templates; the admin app contributes the remaining 9 expected surfaces. No canonical route is currently missing from the source tree.

## Missing/Broken Routes

None found in filesystem inventory. Implementation should avoid creating duplicate route shells.

## Route Templates To Apply

Use the templates recorded in `ROUTE_INVENTORY.json`: PublicLanding, PublicDirectory, PublicDetail, LegalStatic, AuthForm, SuperviseeDashboard, TransactionWizard, RequestDetail, PaymentList, PaymentDetail, RecordArchive, Settings, SupervisorDashboard, SupervisorQueue, SupervisorReviewWorkspace, SupervisorSettings, SupervisorLedger, AdminConsole, AdminTable, LegacyAlias.

## Components/Docs To Update

- Route/evidence docs under this evidence folder.
- Product source should only be patched if browser QA shows a concrete UI defect or a canonical route is broken.
- Do not create AppShell/AdminShell/ClinicFlowShell replacements.

## Risks

- Admin screenshots under local `next start` require `ADMIN_IP_ALLOWLIST=127.0.0.1,::1` and demo fallback if local DB schema is unavailable.
- Alias routes must be counted separately but may visually land on canonical destinations.
- Broad git porcelain has previously stalled; use bounded/scoped receipts if needed.

## Rollback Plan

- Switch back: `git switch experiment/styleseed-clinicflow-heavy-reconstruction` or `git switch ulw/multi-agent-scenario-ux-hardening`.
- Delete this branch after leaving it: `git branch -D adopt/preferred-ui-structure-full-route-coverage`.
- No push/deploy/prod will be performed.

## QA Plan

1. Capture 44 screenshots at 1440x1000 across web/admin including aliases and dynamic demo IDs.
2. Generate route coverage matrix JSON/CSV and screenshot manifest.
3. Run `git diff --check`, `pnpm origin14:check`, web/admin typecheck, web/admin build, and lint.
4. Update final Korean report with route count, 35-page explanation, verification, risks, rollback.
