# Vercel Build Results

## Candidate
- Branch: `ulw/overnight-commercial-readiness-master`
- Source commit: `a187b3f82956d458d020d323a96f38bd243c8889`
- Commit message: `refactor(ui): harden ClinicFlow route continuity and workbench UX`
- Note: these deployment records are for the source candidate used for visual acceptance. A later evidence-only commit may become branch HEAD without changing the UI source.

## clinicflow-web
- Project: `clinicflow-web`
- Deployment ID: `dpl_3niyhDEqDAQjtL4oVb5vV8quDi18`
- Preview URL: `https://clinicflow-1pbfvessr-gunhwipak-debugs-projects.vercel.app`
- Source: Git
- Target: Preview (`target: null`)
- State: READY
- Commit SHA: `a187b3f82956d458d020d323a96f38bd243c8889`
- Commit verification: unverified, but deployment was not blocked.

## clinicflow-admin
- Project: `clinicflow-admin`
- Deployment ID: `dpl_B5d7ND3G5pP1XVps9v7nhcELXPFc`
- Preview URL: `https://clinicflow-admin-9pa32g7l1-gunhwipak-debugs-projects.vercel.app`
- Source: Git
- Target: Preview (`target: null`)
- State: READY
- Commit SHA: `a187b3f82956d458d020d323a96f38bd243c8889`
- Commit verification: unverified, but deployment was not blocked.

## Build Configuration Observed
- Repository root is used for the monorepo projects.
- Web build command: `pnpm --filter @csp/web build`
- Web output directory: `apps/web/.next`
- Admin build command: `pnpm --filter @csp/admin build`
- Admin output directory: `apps/admin/.next`

## Access Notes
- Web Preview routes were reachable.
- Admin Preview routes returned `admin_network_blocked` / `missing_allowlist`; this is an environment/access configuration blocker, not a Vercel build failure.
