# Screenshot Manifest

- Candidate source commit: `a187b3f82956d458d020d323a96f38bd243c8889`
- Web Preview: `https://clinicflow-1pbfvessr-gunhwipak-debugs-projects.vercel.app`
- Admin Preview: `https://clinicflow-admin-9pa32g7l1-gunhwipak-debugs-projects.vercel.app`
- Primary viewport: `1980x1080`
- Secondary viewport: `1440x1000`

## Commit-Friendly Evidence

- `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/overnight-commercial-readiness-vercel-acceptance/2026-06-19/contact-sheet-1980x1080.png`
- `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/overnight-commercial-readiness-vercel-acceptance/2026-06-19/contact-sheet-1440x1000.png`

## Raw Screenshots

Raw route screenshots are intentionally stored under `screenshots/` and should not be staged wholesale.

## Route Coverage Summary

- `web` `/`: KEEP - Public landing renders with product-clear hero, workbench preview, and no visible layout break.
- `web` `/supervisors`: KEEP - Directory row/list structure renders; preview demo supervisor appears only through preview/demo fallback path.
- `web` `/supervisors/[id]`: KEEP - Supervisor detail renders products, credentials, and primary request CTA cleanly.
- `web` `/login`: KEEP - Form-first auth layout renders cleanly.
- `web` `/signup`: KEEP - Form-first signup renders with required consent controls.
- `web` `/email/verify`: KEEP WITH CAUTION - Invalid verification-link recovery copy renders; successful verification remains dependent on Preview auth/DB readiness.
- `web` `/requests/new`: PARTIAL KEEP - Route renders login-required gate; authenticated request-workbench visual not proven because demo login did not establish a Preview session.
- `web` `/requests/[id]`: PARTIAL KEEP - Route renders login-required gate; authenticated detail-workbench visual not proven on Vercel.
- `web` `/case-archive`: PARTIAL KEEP - Route renders login-required gate; authenticated archive contents not proven on Vercel.
- `web` `/supervisor/requests/[id]`: PARTIAL KEEP - Route renders login-required gate; authenticated supervisor workspace not proven on Vercel.
- `admin` `/admin`: BLOCKED - Build READY, but route returns admin_network_blocked / missing_allowlist.
- `admin` `/admin/queue`: BLOCKED - Build READY, but route returns admin_network_blocked / missing_allowlist.
- `admin` `/admin/qualifications`: BLOCKED - Build READY, but route returns admin_network_blocked / missing_allowlist.
- `admin` `/admin/payouts`: BLOCKED - Build READY, but route returns admin_network_blocked / missing_allowlist.
- `admin-local` `/admin*`: SUPPLEMENT ONLY - Local admin locked-state pages render cleanly; post-auth admin operational rows still require a valid admin Preview session.
