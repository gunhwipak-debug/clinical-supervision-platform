# Screenshot Manifest

Folder: `demo-evidence/preview-e2e-demo-readiness-pass/2026-06-17/screenshots`

## Capture Status

No route screenshots were captured in this pass.

## Reason

The local Next dev server for `apps/web` started a process tree but did not print a startup banner and did not open port `3020` after more than five minutes:

- `pnpm exec next dev --port 3020`
- `next dev --port 3020`
- Next `start-server.js`

The process was terminated to avoid leaving a hung dev server running.

## Impact

- `contact-sheet.png` was not generated.
- Browser-level verification remains required after the runtime/startup blocker is resolved or after a fresh Vercel Preview is available.

## Routes That Still Need Capture

Public:

- `/`
- `/supervisors`
- `/supervisors/[id]`

Supervisee:

- `/requests`
- `/requests/[id]`
- `/requests/new`
- `/payments`
- `/payments/[id]`
- `/payments/confirm`
- `/case-archive`

Supervisor:

- `/supervisor`
- `/supervisor/requests`
- `/supervisor/requests/[id]`
- `/supervisor/profile`
- `/supervisor/qualifications`
- `/supervisor/products`
- `/supervisor/availability`

Admin:

- `/admin`
- `/admin/queue`
- `/admin/qualifications`
- `/admin/refunds`
- `/admin/payouts`
- `/admin/audit`
- `/payouts`
- `/refunds`
