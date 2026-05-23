# Agent B Interaction Audit - Supervisee Flow A

Date: 2026-05-22
Scope: Supervisee search/detail/request/submit/payment/settings on `http://localhost:3000`
Account: `supervisee@demo.local` / `DemoPass!23`
Code/config changes: none

## Result Summary

The core supervisee path is partly usable:

- Login works and redirects to `/supervisors`.
- Supervisor list renders and profile cards open detail pages.
- The exact supervisor detail CTA `의뢰 신청하기 (Request Supervision)` opens `/requests/new`.
- Request wizard can create a submitted request and lands on `/requests/:id`.
- Settings page renders.

Several controls are still static, misleading, or routed incorrectly:

1. Search input on `/supervisors` is visual-only.
   - Repro: login, open `/supervisors`, type `성인`, press Enter.
   - Expected: filter/list update or explicit no-op state.
   - Actual: visible list does not change.
   - Evidence:
     - `04-supervisors-list.png`
     - `05-supervisors-search-enter.png`

2. `My Requests` navigation is misrouted on `/supervisors` and `/supervisors/:id`.
   - Repro: open `/supervisors` or `/supervisors/10000000-0000-4000-8000-000000000101`, click top nav `My Requests`.
   - Expected: supervisee route `/requests`.
   - Actual: routes to supervisor route `/supervisor/requests`.
   - Likely cause: pathname prefix check treats `/supervisors` as `/supervisor`.
   - Evidence:
     - `focus-detail-after-my-requests-nav.png`
     - `focus-list-after-my-requests-nav.png`
     - `focus-raw.json`

3. Generic text click around supervisor detail can hit `My Requests` before the real CTA.
   - Repro: broad text target containing `Request` on supervisor detail can select top nav `My Requests`.
   - Expected: only the explicit CTA starts request.
   - Actual: first matching `Request` text may route to supervisor queue.
   - Note: Exact CTA button works.
   - Evidence:
     - `06-supervisor-detail.png`
     - `focus-detail-after-exact-request.png`

4. Request wizard submit label is confusing.
   - Repro: `/requests/new`, click `다음` twice.
   - Expected: final action clearly shows `요청 제출` or `제출`.
   - Actual: automation did not find a visible submit label, but the second/third next action still submitted and redirected.
   - Risk: user may not realize when the request is actually submitted.
   - Evidence:
     - `09-new-request-step2.png`
     - `10-new-request-step3-checked.png`
     - `11-request-detail-after-submit.png`
     - `audit-raw.json`

5. Payment CTA fires API calls but gives no visible feedback or navigation.
   - Repro: after submitted request detail, click `결제하기`.
   - Expected: visible paid/awaiting supervisor review state, redirect, toast, or payment detail.
   - Actual: page remains on the same request detail; no visible success/failure feedback.
   - Observed network: `/api/payments/intent` returns 200 and `/api/payments/confirm` is requested.
   - Evidence:
     - `12-after-payment-cta.png`
     - `focus-payment-before.png`
     - `focus-payment-after.png`
     - `focus-payment-raw.json`

6. `/payments` receipt actions are static.
   - Repro: open `/payments`, click `영수증 출력` / receipt-related controls.
   - Expected: print, detail route, or receipt modal.
   - Actual: page stays on `/payments`; no visible change.
   - Evidence:
     - `13-payments-list.png`
     - `14-payment-detail-attempt.png`

7. Settings page appears supervisor-oriented for a supervisee.
   - Repro: login as supervisee, open `/settings`.
   - Expected: supervisee account/security settings.
   - Actual: sidebar/profile copy shows `Dr. Kim, PhD`, `Clinical Supervisor`, `New Feedback`, license number fields.
   - Evidence:
     - `15-settings-page.png`

## Suggested Fixes Requiring User Confirmation

No fixes were applied. Recommended code-only UI interaction fixes:

1. Fix route prefix logic:
   - Treat `/supervisor` and `/supervisor/...` as supervisor console only.
   - Do not let `/supervisors` match that branch.

2. Wire `/supervisors` search input:
   - Minimum: filter visible Stitch cards client-side.
   - Better: route query string to existing search API/page data if available.

3. Make request wizard final step explicit:
   - Preserve Stitch DOM, but ensure final visible button text/state says request will be submitted.
   - Prevent accidental submit on ambiguous `다음` if user is not on final step.

4. Add visible payment result handling:
   - On successful intent/confirm, refresh or navigate to `/payments`.
   - On failure, display a small inline error state without extra noisy messages.

5. Wire receipt controls:
   - `영수증 출력` should call `window.print()`.
   - Detail/receipt links should navigate to an existing payment detail route if a valid ID exists; otherwise mark disabled.

6. Split settings presentation by role:
   - Keep backend unchanged.
   - For supervisee, hide supervisor-only copy/actions in the Stitch shell or redirect to a supervisee-safe settings view.

## Evidence Files

- `audit-raw.json`
- `focus-raw.json`
- `focus-payment-raw.json`
- `01-login-page.png` through `15-settings-page.png`
- `focus-detail-before-exact-request.png`
- `focus-detail-after-exact-request.png`
- `focus-detail-after-my-requests-nav.png`
- `focus-list-after-my-requests-nav.png`
- `focus-payment-before.png`
- `focus-payment-after.png`
