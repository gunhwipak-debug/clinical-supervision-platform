# Verification Results

Generated: 2026-06-18T00:31:04.889Z

## Commands

| Command | Result | Notes |
|---|---|---|
| `git diff --check` | PASS | no whitespace errors |
| `pnpm origin14:check` | PASS | 41/41 checks passed; governance warnings only: StyleSeed reminder, PrimaryActionPanel justification reminders, anti-noise reminder |
| `pnpm --filter @csp/web typecheck` | PASS | `tsc --noEmit` exited 0 |
| `pnpm --filter @csp/admin typecheck` | PASS | `tsc --noEmit` exited 0 |
| `pnpm --filter @csp/web build` | PASS | Next build generated 54 web app pages/routes; Next ESLint plugin config warning only |
| `pnpm --filter @csp/admin build` | PASS | Next build generated 13 admin app pages/routes; Next ESLint plugin config warning only |
| `pnpm lint` | PASS | `eslint . --max-warnings=0` exited 0 |

## Browser Evidence

- Viewport: 1440x1000
- Expected route surfaces: 44
- Captured screenshots: 44
- PASS: 39
- INTENTIONALLY REDIRECTED: 5
- BROKEN: 0
- NOT CAPTURED: 0
- Next.js RSC prefetch aborts ignored: 3

## Protected Scope Audit

PASS. No tracked diffs were found under the forbidden path scan for API auth/payment, DB/schema, case-files/PDF, package/lockfile, or admin API paths.

Forbidden path scan used:

`git diff --name-only -- apps/web/src/app/api apps/web/src/lib/case-files apps/web/src/components/case-files-panel.tsx packages/db apps/admin/src/app/api pnpm-lock.yaml package.json apps/web/package.json apps/admin/package.json`

Result: empty.

## Runtime Cleanup

PASS. Playwright browser contexts were closed, local web/admin `next start` sessions were stopped, and `lsof -nP -iTCP:3000 -iTCP:3001 -sTCP:LISTEN` returned empty.

## Visual QA Follow-up

PASS. Earlier visual QA blockers were addressed before the final verification pass:

- Admin top-nav console drift was replaced with left-sidebar admin chrome.
- Non-blocking dark support panels were converted to light bordered surfaces.
- Admin operational pages reduced AdminCard overuse in favor of list/table frames.
- Admin payout compute CTA was shortened and set to nowrap.
- 44-route screenshot evidence was regenerated after these visual fixes.

## Remaining Notes

- Admin local browser QA rendered through the existing demo fallback because the local database schema is unavailable. This is acceptable for route/shell/visual coverage but should be rechecked against Vercel Preview.
- No push, deploy, or production command was run.

## Cleaner Audit

- `AI_SLOP_CLEANER_REPORT.md`: PASS WITH NOTES; no code changes. Oversized source files deferred to a separate behavior-pinned refactor; CLI guard `console.log` is expected output.
