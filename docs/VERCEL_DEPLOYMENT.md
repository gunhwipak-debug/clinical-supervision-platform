# Vercel Deployment

ClinicFlow's current public web deployment is hosted on Vercel. Treat this as
the active deployment handoff for the web app.

## Project

- Vercel project name: `clinicflow-web`
- Framework: Next.js
- Runtime Node version: `24.x`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @csp/web build`
- Output directory: `apps/web/.next`
- Production app: `apps/web`
- Admin app: not part of this Vercel production deployment; keep it separate
  unless a future release task explicitly changes that.

The local `.vercel/project.json` file contains the linked project and team IDs,
but `.vercel/` is intentionally ignored. Do not commit that directory.

## Required Environment Handling

Use `.env.example` as the variable checklist. Set real values in the Vercel
project dashboard or through Vercel CLI environment commands. Never commit
`.env`, `.env.local`, downloaded env files, service-role keys, API keys, OAuth
secrets, payment secrets, or mailer credentials.

Minimum production groups to review before deploying:

- Database and Supabase runtime values.
- PHI encryption and auth secrets.
- Public web/admin URLs.
- Admin IP allowlist.
- Google Calendar OAuth values for booking workflows.
- Storage adapter and bucket credentials.
- Toss Payments values.
- Mailer values.
- Optional monitoring/design sync values.

## Deployment Verification

Use the web target command for Vercel parity:

```bash
pnpm --filter @csp/web build
```

Then verify the deployed login route:

```bash
curl -I -L https://clinicflow-452utruml-gunhwipak-debugs-projects.vercel.app/login
```

Expected current evidence:

- Vercel project `clinicflow-web` latest production deployment is `READY`.
- Latest verified deployment URL:
  `https://clinicflow-452utruml-gunhwipak-debugs-projects.vercel.app/login`
- `/login` returned `HTTP/2 200` with `x-matched-path: /login` on
  2026-06-13.
- Vercel build logs showed `pnpm --filter @csp/web build` and successful Next.js
  compilation for commit `18cec49c52c56b2653b009dc43cf9bc2a8eb8fd9`.

## Current Local Caveat

On the current Mac checkout, local `pnpm --filter @csp/web build`,
`pnpm --filter @csp/web typecheck`, root `pnpm build`, and root
`pnpm typecheck` have shown long silent waits and were stopped manually. Vercel
itself completed the web build successfully, so this is a local workflow
diagnostic issue rather than evidence that the deployed web build is broken.

Before using this branch as a shared release baseline, fix GitHub authentication
and push the local commits so the remote branch matches the local branch.
