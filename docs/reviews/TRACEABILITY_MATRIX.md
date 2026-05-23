# Traceability Matrix

Generated: 2026-05-22

This matrix maps the original plan in `codex-piped-quiche.md` to current implementation evidence.

## Legend

- Complete: implemented and covered by test/demo evidence.
- Demo: works locally but production hardening remains.
- Partial: core exists but important spec pieces are missing.
- Deferred: intentionally out of scope for current build.
- Risk: implemented in a way that needs review before launch.

## Functional Traceability

| Spec area    | Key requirements                                                          | Current evidence                                                                                                                                                                                          | Status           | Notes                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-AUTH      | Signup, email verify, lockout, TOTP, reset, secure session                | Auth routes, `packages/shared/src/auth`, auth integration tests, `demo:run`                                                                                                                               | Complete         | Kakao/Naver OAuth deferred                                                                                                                     |
| FR-PROF      | Supervisor profile, qualification, specialty, product, availability       | `/api/me/*`, supervisor pages, profile tests, journey audit                                                                                                                                               | Partial          | Photo, education/career, evidence upload, profile revalidation trigger need follow-up                                                          |
| FR-SEARCH    | Public approved supervisor search, filters, no PHI                        | `/api/supervisors/search`, `/supervisors`, profile integration tests                                                                                                                                      | Complete for MVP | Keyword, qualification, specialty, availability, price range, and rating/response/completed sorting are wired; richer service-type grouping can follow beta feedback |
| FR-REQ       | Draft request, packet, optional deid checklist, status auth, slot booking | request APIs, status machine, booking/Google Calendar tests, stale booking hold worker, reschedule/session-outcome APIs, `demo:run`                                                                       | Complete for MVP | Timed booking requires supervisor Google Calendar connection; OAuth/FreeBusy/event create/delete, Meet link persistence, rescheduling, and no-show/session outcome recording are implemented |
| FR-REQ files | Multi-file upload, preview metadata, annotations, signed URLs, retention  | case-file APIs, local storage adapter, file integration tests                                                                                                                                             | Demo             | PDF/image/HWP/HWPX/DOCX/XLSX allowed; real converter/watermark/KMS/bucket policy missing                                                       |
| FR-PAY       | Toss payment, refunds, payouts, fee                                       | payment APIs, Toss dev/prod adapter tests, demo payment                                                                                                                                                   | Partial          | Real Toss staging/prod e2e not done; tax invoice/PDF receipt absent                                                                            |
| FR-SUP       | Accept/reject, feedback, completion                                       | supervision workflow APIs/pages, `demo:run`, journey audit                                                                                                                                                | Partial          | Additional info request, inline comments, direct edit, Zoom missing                                                                            |
| FR-REC       | Completion record, review, PDF, moderation                                | completion/review APIs and demo path                                                                                                                                                                      | Partial          | PDF, signature semantics, report/moderation missing                                                                                            |
| FR-NOTIF     | In-app/email notifications                                                | notifications table, `/notifications`, Resend mailer tests, booking/payment/refund/feedback/completion integration tests, `pnpm notifications:session-reminders`, `pnpm notifications:retention-warnings` | Partial          | Sender-domain verification remains                                                                                                             |
| FR-ADMIN     | Qualification, refund/dispute, audit, stats                               | admin APIs/pages, admin policy and network allowlist tests                                                                                                                                                | Partial          | PHI access UI, deletion/dispute SOP missing                                                                                                    |

## Security Traceability

| Security requirement  | Evidence                                                       | Status                             | Notes                                                                                  |
| --------------------- | -------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| PHI encrypted columns | `encryptPhi/decryptPhi`, pgcrypto tests, case packet routes    | Complete for implemented PHI paths | PDF/image PHI scan is separate file security gap                                       |
| PHI GUC limited scope | `rg phiAccess` shows TOTP, packet/detail, feedback, completion | Good                               | Current expansion matches decisions                                                    |
| RLS runtime context   | `withUserContext`, csp_app migration, integration tests        | Good locally                       | Must verify on real Postgres with separate roles                                       |
| Service role boundary | Auth sessionless routes, webhook, purge scripts                | Mostly good                        | Needs deployment secret separation                                                     |
| Admin reason          | admin policy helper, route tests, signed URL audit lookup      | Mostly good                        | Server-rendered admin pages with hardcoded reasons need review                         |
| Signed URL security   | local HMAC token, audit reason not in token, tests             | Demo                               | IP-bound URLs and real storage policies deferred                                       |
| File handling         | allowlisted uploads plus metadata scan                         | Partial                            | OCR/anonymization is no longer a required submit gate; true preview conversion remains |
| CSRF/CSP              | SameSite session present; CSP not clearly audited              | Risk                               | Add explicit browser security header review before public launch                       |

## Evidence Traceability

| Artifact                                          | Meaning                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `demo-evidence/REPORT.md`                         | Full automated Flow A with files/payment/supervisor/admin all passing           |
| `demo-evidence/user-journey-audit/REPORT.md`      | Browser-recorded recruitment/search/payment/supervisor workflow with 0 blockers |
| `demo-evidence/user-journey-audit/STORYBOARDS.md` | Human-readable screenshots and videos by actor                                  |
| `demo-evidence/OPS-REPORT.md`                     | Ops smoke; local mode OK with role split warning                                |
| `docs/decisions/EPIC-1.md`                        | Auth and token decisions                                                        |
| `docs/decisions/EPIC-2-3.md`                      | Profile/search/availability decisions                                           |
| `docs/decisions/EPIC-4.md`                        | Request, PHI regex, status-machine decisions                                    |
| `docs/decisions/EPIC-5.md`                        | File adapter, scanning, watermark, retention decisions                          |
| `docs/decisions/EPIC-6.md`                        | Toss/payment/refund/payout decisions                                            |
| `docs/decisions/OPS-FOUNDATION.md`                | Storage/Toss/Mailer/Admin/Audit operational foundation                          |

## Current Verification Commands

Latest cycle completed before this audit:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm drizzle:check`
- `pnpm format:check`
- `pnpm build`
- `pnpm demo:run`
- `pnpm journey:audit`
- `pnpm e2e`

Run again after any patch queue item that touches code.
