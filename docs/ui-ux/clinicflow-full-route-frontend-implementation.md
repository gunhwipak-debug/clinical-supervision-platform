# ClinicFlow Full Route Frontend Implementation

## Summary

This pass moved the Tech-style ClinicFlow direction from a static preview toward the real Next.js route architecture. Runtime routes must now extend the approved origin-14 React/Tailwind language directly; the old static preview reader has been removed from app source so old template surfaces cannot re-enter production by accident.

The route tree now contains 44 page templates:

- Web app: 35 pages
- Admin app: 9 pages

The route-to-design-source ledger is now maintained in
`docs/ui-ux/clinicflow-route-alignment-manifest.md`. Use that manifest to
distinguish the 14 approved UI originals from the 44 real route templates.

The static HTML evidence remains under `demo-evidence/rebuild-tech-ui`, but it is not read by the Next.js app at runtime.

The fast non-regression gate is:

```sh
pnpm origin14:check
```

It verifies the 14 origin page PNGs, the 44 page-template count, exact route-manifest coverage, absence of the old runtime static-preview reader, public-header label discipline, required Origin-14 guardrail docs, and old visual/copy drift patterns. It does not replace browser QA, but it prevents the specific drift that caused old templates to re-enter the route surface.

The same guard is also called from `release:web:fast-check` before the heavier local checks.

Four architecture pages were added because they existed in the product plan but were missing from the current route tree:

- `/guide`
- `/case-archive`
- `/supervisor/memory`
- `/admin/queue`

## Shared UI

Added `SiteHeader`, `PageIntro`, `FlowStepNav`, `PrimaryActionPanel`, and `SectionBlock` in `apps/web/src/components/clinicflow-shell.tsx`.

The shared header is intentionally compact. It exposes only public discovery links,
login, and the main start CTA. Role-specific work such as request detail, upload,
payment, learning records, supervisor queue, and admin operations stays inside the
relevant route body or side navigation.

`AppShell`, auth pages, public policy pages, supervisor search, supervisor detail, request list, supervisor home, supervisor profile, and supervisor products now use this shared header or the shared app shell.

## Workflow Direction

The frontend copy is aligned around:

`슈퍼바이저 찾기 -> 세션 선택 -> 일정 선택 -> 사례자료 정리 -> 확인·결제 -> 수락 대기 -> 슈퍼비전·검토 -> 피드백 확인 -> 학습 기록`

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
- `제공 항목` where the user sees a supervision choice
- `슈퍼바이지` in beginner-facing account/payment/request copy
- `구글 캘린더`, `OAuth`, `초안`, `관리자 사유`, `정산 산출` in user-facing UI or notifications

Remaining broad-copy-scan matches are limited to internal implementation comments or route/API names where changing the identifier would alter integration semantics.

The current contract for copy hygiene is recorded in
`docs/ui-ux/clinicflow-current-design-contract.md`.

## Verification

Latest note: local `next dev`, local typecheck, and targeted ESLint can still hang on this machine before producing useful output. Current route screenshot QA is therefore proven through deployed Vercel surfaces instead of local Next.

Completed:

- Origin-14 guard: `pnpm origin14:check -- --evidence .omo/evidence/origin14-guard-final-25.json` passed 25/25 checks
- Latest guard: `node scripts/clinicflow-origin14-guard.mjs` passed 25/25 checks
- UI release gate: `pnpm release:web:ui-check` passed with evidence timestamp `20260615T015943`
- Guard syntax check: `node --check scripts/clinicflow-origin14-guard.mjs` passed
- Route archetype scan: `44` page templates, `0` weak route surfaces
- User-facing rejected-label scan over app/admin UI source returned no matches
- Web route screenshots: `demo-evidence/route-alignment-qa/20260615T0104-preview-web`, 35/35 HTTP 200 screenshots
- Admin route screenshots: `demo-evidence/route-alignment-qa/20260615T0129-production-admin`, 9/9 HTTP 200 screenshots
- Combined route summary: `demo-evidence/route-alignment-qa/20260615T0129-44-route-summary.md`, 44/44 rendered route templates
- Route inventory after implementation: `.omo/evidence/clinicflow-full-frontend/route-coverage-after.md`
- Changed file list: `.omo/evidence/clinicflow-full-frontend/changed-files.txt`
- Copy scan: `.omo/evidence/clinicflow-full-frontend/copy-scan.txt`
- Patch whitespace check: `git diff --check` passed
- Prettier check over the Origin-14 guard/docs and latest payment-confirm UI file passed

Previously blocked in this local environment:

- default `pnpm --filter @csp/web typecheck`
- `pnpm --filter @csp/web build`
- `pnpm --filter @csp/admin build`
- targeted `eslint`
- `pnpm --filter @csp/web dev`

Earlier fast-release verification used `tsc --noEmit --incremental false --pretty false` for web/admin and passed in the local checkout. Latest remeasurement after the final UI/runtime-source cleanup shows typecheck and Next startup instability again, so `.omo/evidence/fast-release/LATEST.md` must not be treated as final approval for the current dirty worktree.

## Remaining Risk

Because local Next build/dev and targeted ESLint validation can still hang before producing useful output, local developer parity remains a release-hygiene risk. The actual route screenshots have been captured from Vercel surfaces.

Additional product-readiness risks:

- Public supervisor discovery is implemented as real React pages, but production data/error/empty states still need online QA.
- `/requests/new` now moves the user directly into `/requests/[id]#case-files` after creation, but final end-to-end sales flow should still connect material upload more directly before payment.
- `/supervisor/memory` is a derived folder view, not yet a durable OneNote-like note model.
- Admin payout execution remains an operations workflow, not a fully automated payout release system.
- Admin route screenshots currently prove deployed locked-state/redirect surfaces, not authenticated admin inner data states. Full admin-role QA needs a valid admin session.
