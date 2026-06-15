# ClinicFlow Route, Auth, and Status Contract

Status: active architecture contract  
Last updated: 2026-06-15

This document records the route/auth/status source-of-truth relationships without changing implementation behavior.

## App Split

ClinicFlow currently has two separate Next.js apps:

- `apps/web`: public, supervisee, and supervisor surfaces.
- `apps/admin`: operator/admin console.

Do not create a second parallel shell/navigation system for either app. Extend the current shell components unless a future task explicitly replaces the architecture.

## Public Routes

Public routes are discovery and trust-building surfaces. They use the public header contract from `AGENTS.md` and `docs/ui-ux/clinicflow-current-design-contract.md`.

Public routes should not expose workflow-only entries such as material upload, payment, review, payout, audit, or operation queues in the global header.

## Supervisee Routes

Supervisee routes are authenticated workflow routes. They should show the current request state, one next action, and at most one fixed summary panel.

Relevant implementation files:

- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/app-navigation.tsx`
- `apps/web/src/components/account-menu.tsx`
- `apps/web/src/app/(supervisee)/requests/[id]/request-detail-view-model.ts`

## Supervisor Routes

Supervisor routes are queue-first work surfaces. They should prioritize requests that need review, feedback, additional material handling, or schedule decisions.

Relevant implementation files:

- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/app-navigation.tsx`
- `apps/web/src/app/(supervisor)/supervisor/**`

## Admin Routes

Admin routes belong to `apps/admin`, not the public web app shell. The web app middleware may redirect admin paths to the admin app when the user has an admin session.

Relevant implementation files:

- `apps/web/src/middleware.ts`
- `apps/admin/src/middleware.ts`
- `apps/admin/src/components/admin-shell.tsx`
- `apps/admin/src/components/admin-account-menu.tsx`
- `apps/admin/src/lib/auth/current-admin.ts`

## Route Protection

Current route/auth source files:

- `apps/web/src/lib/auth/guards.ts`
- `apps/web/src/lib/auth/current-user.ts`
- `apps/web/src/middleware.ts`
- `apps/admin/src/lib/auth/current-admin.ts`
- `apps/admin/src/middleware.ts`

Contract:

- Public users may access public discovery routes.
- Unauthenticated users reaching protected web routes should be redirected to login or shown a clear locked state.
- Non-admin users reaching admin routes must not be silently sent to an unrelated settings page.
- Admin app access may have an additional network allowlist gate.

## Status Machine

Internal state semantics live in:

- `packages/shared/src/supervision/status-machine.ts`

User-facing request state mapping lives near the route surface:

- `apps/web/src/app/(supervisee)/requests/[id]/request-detail-view-model.ts`

Contract:

- Internal status names are system state, not user-facing copy.
- User-facing labels must be concise Korean.
- Status-to-step mapping may compress the full service flow for a page, but must not hide critical states such as payment needed, supervisor review waiting, additional material requested, feedback arrival, or learning-record completion.

Current caution:

- The request detail view uses a compressed step model. Future refactors must verify that `awaiting_supervisor_review`, accepted/rejected states, and completion states remain visibly distinct to users.

## Related Active Documents

- `docs/ui-ux/clinicflow-origin14-design-system.md`
- `docs/ui-ux/clinicflow-current-design-contract.md`
- `docs/ui-ux/clinicflow-route-alignment-manifest.md`
- `docs/ui-ux/clinicflow-ia-navigation-refactor-plan.md`
