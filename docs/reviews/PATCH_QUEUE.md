# Patch Queue

Generated: 2026-05-22

This queue turns the implementation audit into actionable work. Items are ordered by launch risk, not by implementation size.

## P0: Required Before Any Public URL

### P0-1 Real Postgres/Supabase migration smoke

- Goal: prove the current app works outside PGlite.
- Tooling status: `pnpm ops:db-smoke` now writes
  `demo-evidence/REAL-DB-SMOKE.md` and `demo-evidence/real-db-smoke.json`.
  It is read-only by default and skips/warns cleanly until real credentials are supplied.
- Work:
  - Provision Supabase/Postgres with pgcrypto and migrations `0000+`.
  - Use `DATABASE_URL` as `csp_app` and `SERVICE_DATABASE_URL` as service role.
  - Run `pnpm ops:db-smoke`, core RLS tests, and `pnpm demo:run` equivalent against the real DB.
- Acceptance:
  - No superuser runtime path.
  - RLS cross-user checks pass.
  - PHI encrypt/decrypt roundtrip passes.

### P0-2 File upload workflow

- Goal: support real supervision evidence while keeping unsupported binaries out.
- Tooling status: EPIC 5 upload policy now allows PDF, images, HWP/HWPX, DOCX/XLSX,
  and text formats; executables, archives, disk images, unknown binaries, and
  MIME/extension mismatches are blocked with `unsupported_file_type`.
- Work:
  - Validate the allowlist against Supabase private Storage.
  - Implement production-grade preview conversion for HWP/HWPX, DOCX/XLSX, and PDF
    derivatives.
  - Implement true page-level watermarking and legal copy review before launch.
  - Validate completed+7d raw-file retention purge against real storage.
- Acceptance:
  - Accepted files are never described as automatically anonymized or OCR-clean.
  - Download watermark, preview access, annotations, and access logs are verified on
    real storage.

### P0-3 Toss staging e2e

- Goal: prove real Toss integration before accepting money.
- Work:
  - Configure Toss test keys and webhook secret.
  - Run confirm/refund/webhook raw-body signature e2e.
  - Verify duplicate confirm/webhook idempotency.
- Acceptance:
  - No `TOSS_MODE=dev` in staging/prod.
  - Staging webhook rejects bad signatures and accepts valid raw-body signatures.

### P0-4 Real mail delivery decision

- Goal: make signup/verify/reset usable outside local logs.
- Work:
  - Pick SMTP or Resend implementation for EPIC 11.
  - Verify sender domain, SPF, DKIM, bounce policy.
  - Keep email bodies PHI-free.
- Acceptance:
  - Email verify and password reset work from a deployed URL.

## P1: Required Before Closed Beta

### P1-1 Supervisor recruitment onboarding

- Goal: make a recruited supervisor understand and complete onboarding without operator handholding.
- Work:
  - Add public CTA to `/signup?role=supervisor`.
  - Improve post-signup guidance for email verification and pending approval.
  - Add profile photo/evidence upload policy or explicitly defer with clear copy.
- Acceptance:
  - New supervisor can register, verify email, fill profile, submit qualification, create product/availability, and see pending public status.

### P1-2 Booking/availability contract

- Goal: harden the real booking contract beyond the MVP hold.
- Current implementation:
  - Supervisor Google Calendar OAuth is implemented.
  - Public supervisor pages combine saved platform availability, existing local bookings, and connected Google Calendar FreeBusy busy intervals.
  - Timed booking products require a connected supervisor Google Calendar; disconnected supervisors do not expose bookable public slots for scheduled products.
  - Creating a scheduled request creates a booking hold, a Google Calendar event, attendee notification, and encrypted Meet link.
  - Supervisee cancellation, supervisor rejection, and full refund approval cancel the local booking and delete/mark the Google event.
  - `pnpm bookings:expire-holds` expires stale unpaid/submission-incomplete booking holds and deletes/marks the Google event when possible.
- Work:
  - Keep testing rescheduling, meeting-link persistence, 24-hour refund/change cutoff, and no-show/session outcome actions as part of the reservation regression suite.
  - Keep the current invariant: selected public slot creates a booking hold, excludes existing bookings, and must sync with Google Calendar before the booking is accepted.
- Acceptance:
  - Supervisee and supervisor screens show the same booking time and Meet link, and never expose a slot unless the selected supervisor's saved availability and Google Calendar busy time have both been checked.

### P1-3 Admin reason and admin route consistency

- Goal: keep admin UX aligned with the security model.
- Work:
  - Done: refund/qualification action panels and payout computation no longer prefill reusable generic reasons; admins must type a fresh 30+ character reason for each sensitive action.
  - Review remaining server-rendered admin pages that set hardcoded `adminReason` for queue/dashboard reads.
  - For non-PHI aggregates, avoid unnecessary admin reason GUC.
  - For sensitive queues/audit/PHI access, require explicit reason input.
- Acceptance:
  - No hidden hardcoded reason is used for sensitive admin access.

### P1-4 Completion record hardening

- Goal: prevent completion records from being mistaken for formal legal certificates.
- Work:
  - Add fixed responsibility limitation language to UI and generated output.
  - Decide PDF implementation path.
  - Add tests for immutable completion records and review flow.
- Acceptance:
  - Completion text/PDF carries the required limitation language.

### P1-5 Notification skeleton

- Goal: make state transitions visible without checking the app manually.
- Work:
  - Done: add PHI-free in-app notifications plus best-effort mailer messages for booking draft creation, payment success, supervisee cancellation, supervisor accept/reject, refund approval, feedback submission, feedback approval, and completion record issuance.
  - Done: add `pnpm notifications:session-reminders` for deduplicated pre-session reminders.
  - Done: add `MAILER_MODE=resend` for real outbound email without adding SDK dependency.
  - Done: add `pnpm notifications:retention-warnings` for deduplicated retention-expiry warnings.
  - Remaining: verify sender domain, SPF/DKIM, bounce/complaint policy, and production API key before public launch; no Kakao yet.
- Acceptance:
  - Current critical booking/payment/refund flow can show a notification trail without leaking case content.
  - Reminder worker can notify upcoming sessions without manual page refresh.

## P2: Cleanup And Quality

### P2-1 Remove stale duplicate artifacts

- Candidates:
  - Done: removed stale duplicate `apps/web/src/lib/auth/auth.integration.test 2.ts`.
  - Checked: no unused `apps/web/src/components/stitch/*` renderer files are present in the current tree.
  - Checked: no `Codex TODO` comment remains in `apps/web/src/app/globals.css`.
- Acceptance:
  - Typecheck/lint/test/build unchanged.

### P2-2 Route inventory cleanup

- Goal: remove confusing duplicate admin paths.
- Work:
  - Done: `/admin/payouts` and `/admin/refunds` are the canonical admin pages.
  - Done: legacy `/payouts` and `/refunds` route-group pages redirect to the canonical `/admin/...` paths.
- Acceptance:
  - Navigation and Playwright visual tour use one canonical route per admin screen.

### P2-3 Search/profile completeness pass

- Goal: bring profile/search closer to FR-PROF/FR-SEARCH.
- Work:
  - Done: public search page now exposes qualification, specialty, availability, price range, and sort controls backed by the search query.
  - Done: profile integration tests cover approved qualification search, availability filtering, active-product price filtering, fastest-response sorting, and completed-session sorting.
  - Add richer service type grouping if beta users need to distinguish async comment, direct edit, and timed session products from the search page itself.
  - Decide whether education/career belongs before beta.
- Acceptance:
  - Public discovery supports the filters advertised by the UI.

## P3: Planned EPIC Backlog

- EPIC 7: booking, Meet link persistence, reminders, rescheduling, no-show policy.
- EPIC 10: deletion/dispute SOP, admin PHI reason UX. Admin IP allowlist is enforced by the admin app middleware and `ops:smoke`.
- EPIC 11: production mailer, notification center, event logs.
- OAuth: Kakao/Naver console registration and callback flow.
- Compliance/legal: terms, privacy, sensitive data policy, refund/tax wording, completion record liability review.
