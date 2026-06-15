# ClinicFlow Release Hygiene Blockers

Last updated: 2026-06-15

This document tracks runtime, build, deploy, and command-hygiene issues that must
not block Origin-14 UI/UX work.

## Current Decision

Origin-14 UI/UX implementation is verified first with bounded checks:

- `pnpm --filter @csp/web typecheck`
- `pnpm --filter @csp/admin typecheck`
- `pnpm origin14:check`
- targeted browser/static evidence when local runtime is available

`next build`, Vercel deployment, and output-silent long-running commands are
release hygiene work unless the user explicitly asks to focus on release.

## Blockers

### RH-001: Root lint can run without output for too long

Observed command:

```bash
pnpm lint
```

Also observed with a file-bounded command:

```bash
pnpm exec eslint apps/web/src/components/account-menu.tsx apps/web/src/components/app-shell.tsx 'apps/web/src/app/(supervisee)/requests/[id]/page.tsx' apps/admin/src/components/admin-home-page.tsx --max-warnings=0
```

Result:

- Started `eslint . --max-warnings=0`.
- Root lint produced no diagnostic output for more than 90 seconds.
- File-bounded eslint produced no diagnostic output for more than 65 seconds.
- Stopped manually to keep UI/UX work moving.

Impact:

- Not treated as an Origin-14 UI blocker.
- Needs a separate bounded lint strategy before release, such as linting changed
  packages/files first and then root lint with a time budget.

Follow-up:

- Add a fast lint script for changed web/admin source files.
- Investigate whether ESLint scans generated, cache, or evidence folders.
- Keep root lint out of the UI/UX critical path until it is bounded and noisy on
  progress/failure.

### RH-002: `next build` is intentionally not a UI/UX gate

Observed from prior ClinicFlow work:

- Local Next/Node build can hang or diverge from Vercel behavior.
- Vercel errors need release-specific diagnosis instead of UI redesign churn.

Observed during this UI/IA pass:

- `pnpm dev:web` started Next on `http://localhost:3000`.
- Opening `/` through Playwright system Chrome timed out after 30 seconds.
- Dev server output stayed at `Compiling / ...`.
- Server was stopped manually so UI documentation and static verification could
  continue.
- A follow-up curl smoke showed `/` compiled in 32.6 seconds, but the HTTP
  response still did not send bytes within a 45 second curl timeout.
- A multi-route curl smoke for `/login`, `/supervisors`, `/guide`, and `/` also
  timed out before completing, so browser screenshot evidence remains blocked by
  local Next runtime response behavior rather than by the Origin-14 UI contract.

Impact:

- UI changes should continue with typecheck, Origin-14 guard, local route smoke,
  and screenshots where available.
- Release readiness requires a separate stabilization pass.

Follow-up:

- Pin Node LTS with `.nvmrc`.
- Align `package.json` `engines`.
- Confirm Vercel Node runtime.
- Keep deploy URL fixed to `https://clinicflow-web-beta.vercel.app` when release
  work resumes.

### RH-003: Public supervisor search can be slower than the UI budget

Observed command:

```bash
pnpm dev:web
curl -i --max-time 20 http://localhost:3000/supervisors
```

Result before fix:

- `/supervisors` returned `HTTP/1.1 200 OK`, but the first request took about 20
  seconds.
- The route was doing the list search and then fetching full public details for
  each supervisor card.

Fix applied:

- The public list page now uses the batched search result for cards.
- Full qualifications/details stay on the supervisor detail page.
- The public list query is bounded with a 4 second UI safety timeout. If the
  database is slow, the page returns the Origin-14 error/empty state instead of
  hanging.

Result after fix:

- Evidence timestamp `20260615T214353`.
- `/supervisors` returned `HTTP/1.1 200 OK`.
- Dev server log: `GET /supervisors 200 in 5498ms`.
- No timeout `Error` payload remained in the curl response or server log.

Remaining release risk:

- Local database/search latency can still exceed the 4 second UI budget. That is
  a data/runtime performance issue, not a reason to rework the Origin-14 UI.

### RH-004: Local/demo database schema can be incomplete

Observed scenario:

```bash
pnpm dev:web
curl -i -X POST http://localhost:3000/api/auth/login
curl -i http://localhost:3000/supervisor
curl -i http://localhost:3000/supervisor/profile
curl -i http://localhost:3000/supervisor/availability
curl -i http://localhost:3000/supervisor/products
```

Result before fix:

- Demo login could stall behind database seed/query work, making the product
  feel as if login had not happened.
- Supervisor setup pages could return 500 or stay blocked when local demo tables
  such as `supervisor_profiles`, `availability_slots`, `service_products`, or
  `supervision_requests` were missing.

Fix applied:

- Demo login now issues the seeded demo session directly for known demo
  accounts, then regular session resolution reads that demo session without
  requiring local demo tables to exist first.
- Supervisor dashboard, profile, availability, and products pages now treat
  missing local demo relations as setup-empty states instead of runtime
  failures.
- The UI still uses the Origin-14 setup structure: one clear page title, one
  primary setup action, row/list sections, and restrained side summaries.

Result after fix:

- Evidence timestamp `20260615T220810`.
- `/api/auth/login` returned `HTTP/1.1 200 OK` and set `csp_session`.
- `/supervisor`, `/supervisor/profile`, `/supervisor/availability`, and
  `/supervisor/products` all returned `HTTP/1.1 200 OK`.
- Browser QA evidence timestamp `20260615T220636` captured profile,
  availability, and products pages after login.

Remaining release risk:

- Real create/update actions still require the expected database migrations and
  seed data. Missing schema is now surfaced as a release hygiene issue, not as a
  reason to replace the Origin-14 UI or block local visual review.

## Latest Bounded Verification

2026-06-15 UI/IA pass:

- Web typecheck: passed.
- Admin typecheck: passed.
- Origin-14 guard: passed, 36/36 checks.
- Formatting check for the updated Origin-14 guard and release hygiene document:
  passed.
- `FAST_RELEASE_USE_GIT=1 FAST_RELEASE_RUN_ORIGIN14_GUARD=1 pnpm release:web:fast-check`:
  passed; evidence timestamp `20260615T124455`.
- `FAST_RELEASE_USE_GIT=1 FAST_RELEASE_RUN_ORIGIN14_GUARD=1 pnpm release:admin:check`:
  passed; evidence timestamp `20260615T123402`.
- Runtime smoke for `/supervisors`: passed after public list optimization;
  evidence timestamp `20260615T214353`, HTTP 200, server route time 5498ms.
- Runtime smoke for demo login and supervisor setup routes: passed after demo
  auth fast path and missing-relation fallbacks; evidence timestamp
  `20260615T220810`, HTTP 200 for login, `/supervisor`,
  `/supervisor/profile`, `/supervisor/availability`, and
  `/supervisor/products`.
- Browser QA for supervisor setup pages: passed; evidence timestamp
  `20260615T220636`, screenshots captured for profile, availability, and
  products after demo login.
- Admin route smoke after concise missing-relation fallback logs: passed;
  evidence timestamp `20260615T225213`, HTTP 200 for `/admin`,
  `/admin/queue`, `/admin/qualifications`, `/admin/refunds`, `/admin/payouts`,
  and `/admin/audit`.
- Web role smoke after demo login and fallback cleanup: passed; evidence
  timestamp `20260615T225254`, HTTP 200 for public routes, supervisee routes,
  supervisor routes, and representative detail/payment routes.
- Visual smoke screenshots: passed; evidence timestamp `20260615T225416`, with
  captures for public home, supervisee requests, supervisor queue, and admin
  operations.
- Role-guard smoke: passed after tightening the `isSupervisee` guard; evidence
  timestamp `20260615T230601`. Unauthenticated supervisee/supervisor pages show
  login-required states, supervisor accounts are blocked from `/requests`,
  `/requests/new`, and `/requests/[id]`, supervisee accounts are blocked from
  `/supervisor` and `/admin`.
- Supervisor role menu browser QA: passed; evidence timestamp
  `20260615T231453`. The authenticated supervisor menu contains only
  `슈퍼바이저 업무` and `운영 설정` groups, and no longer exposes supervisee-only
  links such as `/requests`, `/case-archive`, or `/settings`.
- Request draft browser QA: passed; evidence timestamp `20260615T231453`.
  `/requests/new` shows the `세션·일정` draft step, keeps actual material upload
  out of the draft screen, and points the user toward the next Origin-14 flow.
- Auth integration test: passed with `pnpm exec vitest run
apps/web/src/lib/auth/auth.integration.test.ts`; 7 passed, 2 skipped.
- User-facing status fallback audit: passed. The remaining DB status constants
  are internal comparisons or mapped labels, and unknown UI fallbacks now render
  Korean copy such as `상태 확인 필요` instead of raw state names.
- Missing local/demo relations now log a short fallback note instead of noisy
  database stack traces. The user-facing state remains a clear "cannot load
  right now" surface rather than fake empty data.
- Root lint: release hygiene blocker RH-001.
- Build/deploy: not run by instruction.

## Latest Evidence Paths

- `.omo/evidence/origin14-admin-smoke/20260615T225213/result.txt`
- `.omo/evidence/origin14-web-smoke/20260615T225254/result.txt`
- `.omo/evidence/origin14-visual-smoke/20260615T225416/result.txt`
- `.omo/evidence/origin14-visual-smoke/20260615T225416/01-public-home.png`
- `.omo/evidence/origin14-visual-smoke/20260615T225416/02-supervisee-requests.png`
- `.omo/evidence/origin14-visual-smoke/20260615T225416/03-supervisor-queue.png`
- `.omo/evidence/origin14-visual-smoke/20260615T225416/04-admin-operations.png`
- `.omo/evidence/origin14-role-guard-smoke/20260615T230601/result.txt`
- `.omo/evidence/origin14-flow-settings-browser/20260615T231453/result.txt`
- `.omo/evidence/origin14-flow-settings-browser/20260615T231453/01-supervisor-menu-open.png`
- `.omo/evidence/origin14-flow-settings-browser/20260615T231453/02-supervisor-profile.png`
- `.omo/evidence/origin14-flow-settings-browser/20260615T231453/03-supervisor-availability.png`
- `.omo/evidence/origin14-flow-settings-browser/20260615T231453/04-supervisor-products.png`
- `.omo/evidence/origin14-flow-settings-browser/20260615T231453/05-request-new-draft-flow.png`
