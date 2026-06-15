# ClinicFlow Deployment Contract

Status: active release contract  
Last updated: 2026-06-15

This document records current deployment intent and separates release hygiene from UI/UX source-of-truth work.

## Current Deployment Target

Current public web deployment target:

- App: `apps/web`
- Vercel project: `clinicflow-web`
- Stable URL: `https://clinicflow-web-beta.vercel.app`
- Build command: `pnpm --filter @csp/web build`

Current admin deployment target:

- App: `apps/admin`
- Vercel project: `clinicflow-admin`
- Stable URL: `https://clinicflow-admin-six.vercel.app`
- Build command: `pnpm --filter @csp/admin build`

If any value above differs from Vercel project settings, verify in Vercel before changing docs or release scripts.

## App Split

The web app and admin app are separate Next.js apps. Do not assume a single deployment target unless a future release task explicitly merges them.

## Legacy Netlify Status

Netlify is not the current deployment source of truth for ClinicFlow web production.

The old Netlify guide has been archived at:

- `docs/_archive/2026-06-15/legacy-deployment/NETLIFY_DEPLOYMENT.md`

Netlify-related files may remain for historical or optional deployment experiments, but they must not override the active Vercel contract.

## Known Hardcoded URL Risk

The current codebase contains admin URL fallback behavior. Review these before release if the stable admin URL changes:

- `apps/web/src/middleware.ts`
- `apps/admin/src/components/admin-shell.tsx`
- environment variables such as `NEXT_PUBLIC_ADMIN_APP_URL` or `NEXT_PUBLIC_ADMIN_URL`

Do not silently replace these values during UI/UX work.

## Release Checks

Available release/design checks:

```bash
pnpm origin14:check
pnpm release:web:fast-check
pnpm release:admin:check
```

When local Next/Node checks hang, record the blocker as release hygiene and use the documented fast/UI gate only when the user has accepted the browser or screenshot evidence.

## Related Documents

- `docs/VERCEL_DEPLOYMENT.md`
- `docs/deployment/clinicflow-vercel-release.md`
- `docs/ui-ux/clinicflow-release-hygiene-blockers.md`
