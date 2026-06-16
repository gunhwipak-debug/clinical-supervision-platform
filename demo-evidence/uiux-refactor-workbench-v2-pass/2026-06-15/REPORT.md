# ClinicFlow Desktop Workbench v2 QA Report

Generated: 2026-06-15
Viewport: 1440x1000

## Scope

This QA pass verifies the Visual Source-of-Truth recalibration and desktop workbench polish.

Origin-14 remains the baseline and anti-regression reference, but no longer acts as a ceiling that blocks clearer desktop workbench layouts. Posteady remains a structural reference only.

## Routes Captured

| Route                                            | Result   | H1                                | Notes                                                                                |
| ------------------------------------------------ | -------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `/`                                              | captured | 슈퍼비전 의뢰와 피드백을 한곳에서 | First fold now combines shorter hero copy with an app-like feature preview and tabs. |
| `/requests`                                      | captured | 내 슈퍼비전 의뢰                  | Stable sidebar chrome, compact status strip, table-first request list.               |
| `/requests/new`                                  | captured | 새 슈퍼비전 의뢰                  | Existing 7-step request flow preserved with compact inspector.                       |
| `/requests/10000000-0000-4000-8000-000000000607` | captured | 의뢰 상세                         | Detail-first layout preserved; learning record remains subordinate.                  |
| `/supervisor/requests`                           | captured | 검토할 의뢰                       | Queue-first structure preserved; no card-heavy dashboard filler reintroduced.        |
| `/admin/refunds`                                 | captured | 환불                              | Table-first admin shell preserved.                                                   |
| `/admin/payouts`                                 | captured | 정산                              | Table/list frame preserved with compact right calculation panel.                     |
| `/admin/audit`                                   | captured | 감사 로그                         | Table-first empty state preserved.                                                   |

## Visual QA Checklist

| Check                                                                 | Result |
| --------------------------------------------------------------------- | ------ |
| Origin-14 documented as baseline, not ceiling                         | Pass   |
| Homepage product function visible in first fold                       | Pass   |
| Product preview is app-like, not decorative metric filler             | Pass   |
| Authenticated sidebar feels like app chrome rather than floating card | Pass   |
| `/requests` remains list/table-first                                  | Pass   |
| `/requests/new` and `/requests/[id]` preserve density improvements    | Pass   |
| Admin operational pages remain table-first                            | Pass   |
| Large next-action banners were not reintroduced                       | Pass   |
| Generic summary panels were not reintroduced                          | Pass   |
| Mobile QA intentionally omitted                                       | Pass   |

## Evidence

- Contact sheet: `contact-sheet.png`
- Raw route results: `desktop-workbench-v2-results.json`
- Checklist JSON: `route-checklist.json`

## Verification

| Command                              | Result | Notes                                                                                                                                                                        |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git diff --check`                   | Pass   | No whitespace errors after cleanup.                                                                                                                                          |
| `pnpm origin14:check`                | Pass   | 38/38 checks passed; non-blocking warnings remain for generic next-action copy, PrimaryActionPanel usage, and admin `AdminCard` usage.                                       |
| `pnpm --filter @csp/web typecheck`   | Pass   | `tsc --noEmit` completed.                                                                                                                                                    |
| `pnpm --filter @csp/admin typecheck` | Pass   | `tsc --noEmit` completed.                                                                                                                                                    |
| `pnpm --filter @csp/web build`       | Fail   | Compiled, then failed during Next lint on pre-existing release-hygiene issues in `api/auth/login`, `api/auth/logout`, `lib/db/missing-relation`, and `lib/demo/supervision`. |
| `pnpm --filter @csp/admin build`     | Fail   | Compiled, then failed during Next lint on pre-existing release-hygiene issues in `auth/logout` and `lib/db/missing-relation`.                                                |
| `pnpm lint`                          | Fail   | Project-wide lint still fails on pre-existing script and release-hygiene issues outside this UI pass.                                                                        |

## Known Limitations

- The worktree already contained dirty UI files from previous refactor passes; this report treats that dirty state as the baseline, per instruction.
- Build and lint results are tracked separately because existing release-hygiene failures may remain outside this UI/UX pass.
- Admin locked-state fallback still carries a hardcoded production admin URL default in source code; this was not changed in this pass.
