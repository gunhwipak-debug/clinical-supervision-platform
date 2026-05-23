# Implementation Audit

Generated: 2026-05-22

## Executive Summary

The current implementation reflects the original Claude/Codex plan well for the local MVP path: auth, supervisor discovery, request creation, PHI-gated case packets, optional deidentification checklist, file upload, dev payment, supervisor accept/feedback/completion, review, and admin qualification approval all pass the automated demo flow.

This is not yet an internet-launch-ready service. The largest gaps are operational rather than basic workflow: real Supabase/Postgres deployment, production storage security, ClamAV/OCR/PDF scanning, production Toss e2e, verified sender-domain email delivery, admin PHI review UX, deletion/dispute SOPs, and PDF-grade completion records.

## Evidence Baseline

- `pnpm demo:run`: full signup -> request -> file -> payment -> supervisor -> review -> admin path passed in `demo-evidence/REPORT.md`.
- `pnpm journey:audit`: public supervisor recruitment + supervisee search/payment/materials + supervisor request workflow produced 0 launch blockers in `demo-evidence/user-journey-audit/REPORT.md`.
- `pnpm ops:smoke`: local PGlite mode warns/skips DB-only launch checks, but Google Calendar OAuth credentials are a hard gate because booking sync is core to the product.
- `pnpm ops:db-smoke`: added as the real Postgres/Supabase read-only launch gate; it records runtime role, helper, migration, RLS, GUC, pgcrypto, and optional temp write probe results in `demo-evidence/REAL-DB-SMOKE.md`.
- Current test surface: 21 Vitest files, 202 passed and 4 skipped in the latest verification cycle.

## Coverage Matrix

| Area                | Original intent                                                                      | Current status                                                                                                                 | Assessment                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Auth                | Email/password, email verify, lockout, reset, TOTP, session invalidation             | Implemented with tests and local demo flow                                                                                     | Good MVP coverage; social login OAuth remains intentionally deferred; Google Calendar OAuth is implemented for booking sync |
| Supervisor profile  | Profile, qualifications, specialties, products, availability, public visibility gate | Implemented for MVP; profile/qualification/product/availability UI wired                                                       | Partial vs full spec: photo, education/career, rich credential evidence need follow-up     |
| Search              | Public approved supervisors only, keyword/filter/sort, no PHI                        | Implemented and demo-seeded                                                                                                    | Good MVP coverage; qualification filter and richer service-type filtering need review      |
| Request flow        | Draft, case packet, deidentification, submit, status guard                           | Implemented and demo-tested                                                                                                    | Good MVP coverage; deletion-request policy remains future work                             |
| Files               | Signed upload/download, preview, annotations, watermark, retention purge             | Local adapter, allowlisted evidence files, preview metadata, annotation flow                                                   | Demo level only for production; converter, true watermark, KMS, real bucket policy missing |
| Payments            | Toss intent/confirm/webhook, refunds, payouts                                        | Dev Toss path, prod adapter skeleton, refunds/payout APIs/stubs                                                                | Partial; real Toss staging e2e and operational webhook/IP controls missing                 |
| Supervisor workflow | Accept/reject, feedback, completion, review transition                               | Implemented for critical path and demo-tested                                                                                  | Good MVP coverage; additional info, richer direct edit, Zoom remain missing                |
| Completion/review   | Completion record and review                                                         | Text completion and review flow implemented                                                                                    | Partial; PDF record, signature semantics, report/review moderation missing                 |
| Notifications       | In-app/email reminders and status notifications                                      | In-app notification center, PHI-free mailer hooks, feedback/completion events, session reminder worker, and Resend mailer mode | Sender domain and API key must be verified in deployment                                   |
| Admin/audit         | Qualification approval, refund/payout queues, audit logs, admin reason               | Basic APIs and UI exist; admin reason helper and IP allowlist middleware are hardened                                          | Partial; PHI access UI, deletion/dispute SOPs missing                                      |
| Ops/deploy          | Supabase/Postgres, storage, Toss, mail, smoke                                        | Local demo strong; ops smoke and adapters exist                                                                                | Needs real environment validation before public URL                                        |
| UI/Stitch           | Stitch-inspired UI connected to real routes                                          | Major routes refreshed and journey videos pass                                                                                 | Good demo quality; usability polish should follow real user testing                        |

## Findings

### P0: Public launch blockers

1. Production infrastructure is not verified.
   - Local PGlite passes, but `OPS-REPORT.md` still warns that PGlite uses one DB instance for runtime/service-role paths.
   - Before public URL launch, run `pnpm ops:db-smoke` against real Postgres/Supabase with `DATABASE_URL=csp_app`, separate `SERVICE_DATABASE_URL`, pgcrypto, RLS, and migrations.

2. File preview/storage is demo-grade for production.
   - EPIC 5 now allows PDF/image/HWP/HWPX/DOCX/XLSX supervision evidence and no longer treats OCR/anonymization as a submit gate.
   - Production still needs Supabase private bucket verification, converter/derivative generation, true page-level watermarking, bucket policy, and KMS/lifecycle review.

3. Real payment and outbound mail are not production-proven.
   - Toss prod adapter exists but needs staging key, webhook URL, raw-body signature e2e, and refund/payout dry runs against a real sandbox.
   - `MAILER_MODE=resend` is implemented, but deployment still must verify `RESEND_API_KEY`, sender domain, SPF/DKIM, and bounce/complaint operations.

4. Admin hardening is incomplete for real operations.
   - Admin route helpers require TOTP/reason and production IP allowlist, but admin PHI access UX, deletion/dispute workflows, and audit review operations are not complete.

### P1: Beta readiness fixes

1. Admin server pages still contain hardcoded admin reasons for dashboard/refund/payout/qualification views.
   - Refund/qualification action panels and payout computation now require a fresh 30+ character typed reason instead of prefilled generic text.
   - Remaining review: keep non-PHI aggregate pages reason-free where RLS allows it, and require explicit reason only for sensitive queue/PHI/audit views.

2. Supervisor onboarding is functional but not complete enough for real recruitment.
   - Missing or thin pieces: profile photo, education/career history, qualification evidence file, richer preview, and “what happens after submission” guidance.
   - Recruitment landing should link directly to `/signup?role=supervisor`.

3. Scheduling is now implemented as a real operational booking path.
   - Timed booking products now require the supervisor's Google Calendar connection before public slots can be booked or rescheduled.
   - Slot selection creates a `bookings` row, validates the selected supervisor's availability, checks already-booked intervals, checks Google Calendar FreeBusy, creates/deletes a Google Calendar event for the supervisor, and stores the returned Meet link in `bookings.meeting_url_enc`.
   - Supervisee and supervisor detail screens expose the same booked time, Meet entry link, rescheduling action, and supervisor session outcome actions for completed/no-show sessions.
   - `pnpm bookings:expire-holds` expires stale unpaid/submission-incomplete booking holds and clears the local/Google Calendar slot.

4. Review/completion needs production-grade documents.
   - Assessment now requires feedback approval before the completion/stamp path, while counseling can complete without a stamp.
   - PDF/stamped final artifact generation and responsibility language remain enough for demo only, not formal certificate-like use.

5. Notifications now cover the money/booking-critical path and the review/completion path.
   - Booking draft creation, supervisee cancellation, payment success, supervisor accept/reject, refund approval, feedback submission, feedback approval, and completion record issuance create PHI-free in-app notifications and best-effort mailer messages.
   - `pnpm notifications:session-reminders` scans upcoming accepted/in-review sessions and creates deduplicated reminders for both supervisee and supervisor.
   - `pnpm notifications:retention-warnings` scans files approaching retention expiry and warns both parties before purge.
   - Remaining EPIC 11 work is deployed sender-domain verification.

### P2: Codebase cleanup and maintainability

1. Duplicate or stale artifacts should be cleaned.
   - The stale duplicate `apps/web/src/lib/auth/auth.integration.test 2.ts` was removed.
   - `apps/web/src/app/globals.css` no longer contains a `Codex TODO` comment.
   - No `apps/web/src/components/stitch/*` static renderer files are present in the current tree.

2. Admin route structure has potentially confusing paths.
   - The admin app contains both grouped pages like `/(admin)/payouts` and `/admin/payouts`.
   - Confirm whether root-level `/payouts` and `/refunds` in the admin app are intentional or legacy.

3. Product/demo scripts are strong but should not accumulate generated video trash.
   - `scripts/user-journey-audit.ts` now removes temporary Playwright `page@...webm` files after named videos are saved.
   - Keep this pattern for future visual automation.

## Security Boundary Review

- `phiAccess: true` is limited to TOTP, case packet/detail reads, feedback, and completion routes, matching the current intended expansion.
- Auth/signup/login/password reset use service-role DB where sessionless access is required.
- Payment webhook uses service-role path as intended for sessionless webhook processing.
- Signed download URL no longer carries admin reason plaintext; reason is looked up from audit logs by `signedUrlId`.
- Local storage secret is independent of auth secret and fails fast in production when missing.

## Overall Readiness

- Local demo readiness: high.
- Closed beta readiness on a controlled environment: medium, after real Postgres/Supabase smoke and basic mail/payment staging validation.
- Public production readiness: not yet; file security, notification, admin hardening, legal/compliance review, and real infra validation are still required.
