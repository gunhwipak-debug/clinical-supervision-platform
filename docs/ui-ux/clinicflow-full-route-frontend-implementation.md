# ClinicFlow Full Route Frontend Implementation

## Summary

This pass moved the Tech-style ClinicFlow direction from a static preview toward the real Next.js route architecture.

The route tree now contains 44 page templates:

- Web app: 35 pages
- Admin app: 9 pages

Four architecture pages were added because they existed in the product plan but were missing from the current route tree:

- `/guide`
- `/case-archive`
- `/supervisor/memory`
- `/admin/queue`

## Shared UI

Added `SiteHeader`, `PageIntro`, `FlowStepNav`, `PrimaryActionPanel`, and `SectionBlock` in `apps/web/src/components/clinicflow-shell.tsx`.

The shared header supports hover menus for:

- Service discovery
- User work
- Supervisor work

`AppShell`, auth pages, public policy pages, supervisor search, supervisor detail, request list, supervisor home, supervisor profile, and supervisor products now use this shared header or the shared app shell.

## Workflow Direction

The frontend copy is aligned around:

`슈퍼바이저 찾기 -> 세션 선택 -> 일정 선택 -> 사례 자료 업로드 -> 확인·결제 -> 수락 대기 -> 슈퍼비전·검토 -> 피드백 확인 -> 학습 기록`

The homepage now explains ClinicFlow as an online clinical supervision education platform, not a security product, generic SaaS dashboard, or purchase-first storefront.

## Key Page Additions

### `/guide`

Shows the end-to-end supervision flow in plain Korean with a compact status navigator and one clear starting action.

### `/case-archive`

Turns completed supervision into a folder-like learning record grouped by supervisor, matching the OneNote-style hierarchy requested during review.

### `/supervisor/memory`

Provides a supervisor-facing note surface grouped by request state, positioned as context recall rather than raw AI memory.

### `/admin/queue`

Adds an admin operation queue for qualifications, refunds, payouts, and review-related work.

## Copy Cleanup

Removed or replaced UI-facing terms such as:

- `페이지 이동`
- `지도자`
- `보안 로그인`
- `보안 모드`
- `Toss 결제`
- user-facing `토큰`
- generic `전문가` where it meant `슈퍼바이저`
- `자료실` as the main public navigation label

Remaining broad-copy-scan matches are inside API route error strings, not page/component copy, and were left unchanged to avoid altering backend/API semantics in this UI pass.

The UI-only scan is recorded at `.omo/evidence/clinicflow-full-frontend/ui-copy-scan.txt` and currently has zero matches.

## Verification

Completed:

- Route inventory after implementation: `.omo/evidence/clinicflow-full-frontend/route-coverage-after.md`
- Changed file list: `.omo/evidence/clinicflow-full-frontend/changed-files.txt`
- Copy scan: `.omo/evidence/clinicflow-full-frontend/copy-scan.txt`
- Patch whitespace check: `git diff --check` passed

Blocked in this local environment:

- `pnpm --filter @csp/web typecheck`
- `pnpm --filter @csp/admin exec tsc --noEmit --pretty false`
- `pnpm --filter @csp/web exec tsc --noEmit --pretty false`
- `pnpm --filter @csp/web build`
- `pnpm --filter @csp/admin build`
- targeted `eslint`
- `pnpm --filter @csp/web dev`

All of the above produced no actionable output in the observed window and were interrupted to avoid dangling sessions. Details are recorded in `.omo/evidence/clinicflow-full-frontend/validation-blockers.txt`.

## Remaining Risk

Because local Next/TypeScript/Vite-style validation is currently hanging before producing useful output, browser screenshots of the actual Next routes could not be captured in this pass. The next release-hygiene task should repair or isolate the local Next runtime before deployment.
