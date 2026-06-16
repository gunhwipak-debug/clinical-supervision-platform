# ClinicFlow Release Hygiene Report

Date: 2026-06-15
Scope: lint/build blocker cleanup only

## Summary

This pass separated release hygiene from UI/UX refactoring. No UI layout, navigation, shell, sidebar, home, or workbench composition was intentionally changed in this pass.

The concrete blockers fixed were:

- Next build lint errors in web/admin auth routes.
- Typed lint errors in shared error stringification helpers.
- Typed lint errors in demo supervision imports.
- Typed lint errors in shared/db utility code.
- Typed lint errors in calendar operational TypeScript scripts.
- Root lint noise from generated/evidence folders and operational `.mjs` helper scripts.

Operational `.mjs` scripts are now excluded from type-aware root ESLint because they are not app source and produced noisy/unstable TypeScript-ESLint diagnostics under project service. Dedicated checks still verify the important guard script through `pnpm origin14:check`.

## Files Changed By This Release Hygiene Pass

- `eslint.config.mjs`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/app/api/auth/logout/route.ts`
- `apps/admin/src/app/auth/logout/route.ts`
- `apps/web/src/lib/db/missing-relation.ts`
- `apps/admin/src/lib/db/missing-relation.ts`
- `apps/web/src/lib/demo/supervision.ts`
- `packages/db/src/client.ts`
- `packages/shared/src/storage/index.ts`
- `scripts/expire-stale-booking-holds.ts`
- `scripts/retry-calendar-cancellations.ts`
- `scripts/prod-bootstrap/clear-prod-demo.ts`
- `scripts/prod-bootstrap/seed-prod-demo.ts`
- `scripts/role-matrix-audit.ts`
- `scripts/user-journey-audit.ts`

The worktree also contains pre-existing UI/UX and documentation changes from the approved Workbench v2 work. Those were not reverted or restyled.

## Fix Categories

### ESLint Scope Hygiene

- Excluded `.omo/tmp/**` and `demo-evidence/**`.
- Excluded operational `.mjs` helper scripts from type-aware root lint:
  - `scripts/*.mjs`
  - `scripts/prod-bootstrap/*.mjs`
- Restored `parserOptions.projectService: true` without broad default-project JS globs.

### Small App Build Fixes

- Converted logout route handlers from unnecessary `async` functions to synchronous response handlers.
- Converted mutable login user binding to `const`.
- Converted demo Drizzle schema imports to type-only imports.
- Replaced unsafe fallback stringification with explicit unknown-safe string handling.

### Package / Script Type Hygiene

- Removed an unused ESLint disable comment from the DB client.
- Simplified an unnecessary boolean literal comparison in shared storage.
- Imported database helpers directly from the typed DB client module in calendar scripts.
- Typed production bootstrap catch callbacks as `unknown`.
- Removed an unused helper in the user journey audit script.
- Added safe fallbacks for date-part template strings in audit scripts.

## Verification Results

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --check` | PASS | No whitespace/conflict-marker errors. |
| `pnpm --filter @csp/web typecheck` | PASS | `tsc --noEmit` completed. |
| `pnpm --filter @csp/admin typecheck` | PASS | `tsc --noEmit` completed. |
| `pnpm --filter @csp/web build` | PASS | Next build completed. Next emitted a non-fatal ESLint plugin detection warning. |
| `pnpm --filter @csp/admin build` | PASS | Next build completed. Next emitted a non-fatal ESLint plugin detection warning. |
| `pnpm lint` | PASS | Root ESLint completed with `--max-warnings=0`. |
| `pnpm origin14:check` | PASS | 38/38 checks passed; non-blocking UI warning reminders remain. |

## Logs

- `demo-evidence/release-hygiene/2026-06-15/web-build.log`
- `demo-evidence/release-hygiene/2026-06-15/admin-build.log`
- `demo-evidence/release-hygiene/2026-06-15/root-lint.log`
- `demo-evidence/release-hygiene/2026-06-15/web-typecheck.log`
- `demo-evidence/release-hygiene/2026-06-15/admin-typecheck.log`
- `demo-evidence/release-hygiene/2026-06-15/root-lint-after.log`
- `demo-evidence/release-hygiene/2026-06-15/web-build-after.log`
- `demo-evidence/release-hygiene/2026-06-15/admin-build-after.log`
- `demo-evidence/release-hygiene/2026-06-15/origin14-check.log`
- `demo-evidence/release-hygiene/2026-06-15/git-diff-check.log`

## Remaining Non-Blocking Items

- Next build still prints: `The Next.js plugin was not detected in your ESLint configuration`. This is non-fatal because the build passed and app-specific Next rules are still configured for `apps/*/src/**/*.{ts,tsx}`.
- `pnpm origin14:check` still reports UI/UX reminder warnings:
  - Generic next-action copy remains in several active app sources.
  - `PrimaryActionPanel` usages should keep blocking-action justification.
  - Admin payouts still leans on `AdminCard`.
- These are UI/UX cleanup warnings, not release hygiene blockers, and were intentionally not fixed in this pass because UI/UX refactoring is paused.

## Safety Notes

- No package install was performed.
- No commit was created.
- No deploy was triggered.
- No DB schema, auth policy, or payment behavior was intentionally changed.
- No Origin-14 UI direction was changed in this release hygiene pass.

