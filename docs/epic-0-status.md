# EPIC 0 Status

Updated: 2026-05-18

## Done

- T-000 Monorepo skeleton: `pnpm` workspaces, `apps/web`, `apps/admin`, `packages/db`, `packages/shared`.
- T-001 Strict TypeScript, ESLint, Prettier config.
- T-002 GitHub Actions CI for typecheck, lint, Vitest, Drizzle check.
- T-004 Drizzle 0000 schema migration generated from §10.3.
- T-005 RLS 0001 migration with GUC helpers, FORCE RLS, participant/admin policies.
- T-006 pgcrypto helper in `packages/shared/src/crypto/phi.ts`.
- T-007 `withUserContext` transaction helper in `packages/db/src/context.ts`.
- T-008 `.env.example` and setup docs.

## Manual / Blocked

- T-003 Supabase Seoul project, KMS/storage buckets: requires dashboard login and billing setup. The expected buckets and verification steps are documented in `docs/supabase-setup.md`.

## Verification Commands

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm drizzle:check
pnpm build
```

## Latest Verification

- `pnpm run ci`: passed.
- `pnpm build`: passed for `apps/web` and `apps/admin`.
- Note: Next.js 15 still emits an ESLint plugin detection warning during build with the root flat config, but root `pnpm lint` runs `@next/eslint-plugin-next` successfully.
