# ClinicFlow Origin-14 Regression Analysis

## What Happened

The user's intended workflow was:

1. Build 14 approved origin screens.
2. Treat those screens as the design system.
3. Extend that exact style to all 44 route templates.

The actual workflow drifted into:

1. Preserve the 14-screen PNG/HTML evidence as design evidence.
2. Build many production routes separately in React/Tailwind.
3. Capture 44 route screenshots from the logged-out/local route surface.
4. Use the 44 screenshots as evidence even when they had diverged from the 14 origin screens.

This made the 44-route set look like a mixed product: part origin-14, part logged-out fallback, part admin shell, part older token system.

## Root Causes

### 1. The 14 PNG screens were not declared as the highest-priority source of truth.

The design contract previously pointed primarily to:

- `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`

That was too weak. The approved evidence set was actually the 14 PNG screens in:

- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400`

When the HTML, React pages, tokens, and route screenshots drifted apart, there was no hard rule saying the 14 PNGs win.

### 2. Static preview and production routes used different implementation paths.

The static HTML preview used to be readable from runtime source, but that made it too easy for old preview/template surfaces to leak back into production routes. The runtime app must now extend origin-14 as React pages/components instead of reading static preview HTML.

That means the static source can look correct while production routes slowly reintroduce different spacing, background, radius, panels, and fallback states.

### 3. The design tokens still reflected an older soft Material/Stitch direction.

The route screenshots used token values such as:

- background `#f9f9ff`
- Material-like surface containers
- different blue values
- Hanken/Inter-first font stacks

The origin-14 screens use:

- white canvas
- deep ink `#081225`
- electric blue `#2563ff`
- thin line `#e7ebf1`
- Korean-first typography

This token mismatch affected every route even when the layout was close.

### 4. Logged-out protected routes were captured as sparse locked-state pages.

Several protected routes rendered a generic "로그인이 필요합니다" card because there was no active session in the screenshot run.

The protection behavior is correct, but the locked-state UI did not extend the origin-14 login/workflow archetype. It produced large empty areas and made those pages look unrelated to the 14 origin screens.

### 5. Admin and internal pages kept their own shell language.

The admin shell had a left navigation and operational layout that was functionally useful, but it was not sufficiently constrained by the origin-14 `운영 처리 목록` and `자격 심사` screens.

Admin pages must still be dense and operational, but their surfaces, spacing, heading scale, and list structure must come from the origin-14 admin archetypes.

## Recurrence Prevention

The following rules now exist in project files:

- Root `AGENTS.md` declares the origin-14 PNG set as the highest-priority UI source of truth.
- `docs/ui-ux/clinicflow-current-design-contract.md` defines the Origin-14 Non-Regression Rule.
- `docs/ui-ux/clinicflow-route-alignment-manifest.md` states that 44 screenshots are result evidence, not a source of truth.
- `scripts/clinicflow-origin14-guard.mjs` fails fast if the app reintroduces the old static preview reader, counts a route surface other than 44 page templates, loses exact route-manifest coverage, loses route archetype coverage, loses the 14 origin page PNGs, removes the durable guardrail docs, or adds workflow/role labels back into the public global header.
- `package.json` exposes the guard as `pnpm origin14:check` and `pnpm origin14:guard`.
- `scripts/clinicflow-fast-release.mjs` now runs the Origin-14 guard near the start of `release:web:fast-check`, so commit/deploy preparation cannot silently skip the design-source gate.
- Design tokens were shifted toward origin-14 values.
- Locked states now use a focus panel + side summary structure instead of a sparse empty card.

## 2026-06-15 Alignment Pass

The route inventory is still:

- Web app: 35 `page.tsx` files
- Admin app: 9 `page.tsx` files
- Total: 44 page templates

The alignment pass extended the 14 approved archetypes across the real route surface:

- Public/auth routes now use the home, supervisor directory, guide, and login archetypes.
- Supervisee routes now use the request creation, material upload, request detail, payment, waiting, and learning-record archetypes.
- Supervisor routes now use the supervisor queue and review-workspace archetypes.
- Admin shell, admin home, and qualification review now use the operation-list and qualification-review archetypes.
- Static preview documentation no longer describes a generic `메뉴` control; the header contract is direct public navigation only.

The user's additional `Minimalist Modern` design prompt was recorded as secondary guidance only. It supports electric-blue emphasis, structure, and confident hierarchy, but it does not replace the 14 origin screenshots.

## Verification Notes

Passed:

- `pnpm origin14:check -- --evidence .omo/evidence/origin14-guard-route-archetype.json`: 25/25 checks passed, including exact route-manifest coverage, route archetype coverage, and `/requests/new` draft-first step discipline.
- `pnpm origin14:check -- --evidence .omo/evidence/origin14-guard-final-25.json`: 25/25 checks passed after the latest `Minimalist Modern` prompt was recorded as supporting guidance only.
- `node scripts/clinicflow-origin14-guard.mjs`: 25/25 checks passed after the 44-route evidence update.
- `pnpm release:web:ui-check`: passed with evidence timestamp `20260615T015943`.
- `git diff --check`
- `node --check scripts/clinicflow-origin14-guard.mjs`
- Prettier check over the current guard, Origin-14 docs, AGENTS, and changed payment-confirm UI file
- User-facing app copy scan for rejected labels returned no matches in `apps/web/src/app`, `apps/web/src/components`, `apps/admin/src/app`, and `apps/admin/src/components`
- Independent route archetype scan returned `44` page templates and `0` weak surfaces
- Route inventory check: `35 + 9 = 44`
- Web Vercel screenshot QA: `demo-evidence/route-alignment-qa/20260615T0104-preview-web`, 35/35 route templates returned HTTP 200 and produced screenshots.
- Admin Vercel screenshot QA: `demo-evidence/route-alignment-qa/20260615T0129-production-admin`, 9/9 route templates returned HTTP 200 and produced screenshots.
- Combined 44-route summary: `demo-evidence/route-alignment-qa/20260615T0129-44-route-summary.md`
- Latest web preview QA: `https://clinicflow-30fgcpwpn-gunhwipak-debugs-projects.vercel.app`, 35/35 web route templates returned HTTP 200 and produced screenshots in `demo-evidence/route-alignment-qa/20260615T0145-preview-web-current`.
- Latest web contact sheet: `demo-evidence/route-alignment-qa/20260615T0145-preview-web-current/00-contact-sheet.png`.
- Latest admin route QA: `https://clinicflow-admin-six.vercel.app`, 9/9 admin route templates returned HTTP 200 and produced screenshots in `demo-evidence/route-alignment-qa/20260615T0145-admin-production-current`.
- Latest admin contact sheet: `demo-evidence/route-alignment-qa/20260615T0145-admin-production-current/00-contact-sheet.png`.

Still limited in this local environment:

- `pnpm --filter @csp/web typecheck`: `tsc --noEmit` produced no completion or diagnostics after 60 seconds and was stopped.
- `pnpm --filter @csp/admin typecheck`: `tsc --noEmit` produced no completion or diagnostics after 90 seconds and was stopped.
- ESLint over changed TS/TSX files produced no completion or diagnostics after 90 seconds and was stopped.
- `pnpm --filter @csp/web dev` reached `next dev --port 3000`, but did not bind port `3000`.
- `pnpm --filter @csp/admin dev` reached `next dev --port 3001`, but did not bind port `3001` and required process termination.

This local runner instability no longer blocks route screenshot QA because the current route surface was verified through deployed Vercel surfaces. It remains a release-hygiene risk for local developer workflow.

Authentication caveat:

- The admin screenshots prove deployed route render, redirects, and the Origin-14 locked-state surface.
- They do not prove authenticated admin inner data states. That still requires a valid admin session and should be handled as a separate admin-role QA pass.

## Mandatory Future Workflow

Before changing any ClinicFlow UI:

1. Choose one of the 14 origin archetypes.
2. State which archetype the route extends.
3. Match typography, background, spacing, line-list structure, panel count, and CTA hierarchy.
4. Capture or compare the route against that archetype.
5. If a later screenshot conflicts with the origin-14 PNG, the origin-14 PNG wins.
6. Run `pnpm origin14:check` before claiming the route surface is still aligned.
