# Stitch Export Mapping

Source bundle: `designs/stitch/stitch_clinical_trust_auth_redesign/`

This file is the working map for applying Stitch visual exports onto the existing
Clinical Supervision Platform app. Treat Stitch as the visual reference only:
preserve route paths, data fetching, API request bodies, zod schemas, RLS,
PHI access boundaries, auth/session guards, and existing form behavior.

## How To Use

1. Open the `screen.png` listed for the route and compare it with the current app.
2. Read the matching `code.html` only for layout, spacing, copy, and visual hierarchy.
3. Edit only the listed app UI files: JSX markup, `className`, labels, helper text,
   and client form presentation.
4. Do not edit route handlers, database code, migrations, `withUserContext`,
   `phiAccess`, zod schemas, or security checks.
5. If a Stitch field name differs from the app schema, keep the app field name and
   only borrow the visual label/copy.

## Source Convention

Each screen folder has this shape:

| Source item    | Meaning                                                     |
| -------------- | ----------------------------------------------------------- |
| `*/screen.png` | Visual reference to compare first                           |
| `*/code.html`  | HTML/Tailwind export to translate into JSX                  |
| `*_2/`         | Primary blue clinical-trust direction preferred by the user |
| `*_1/`         | Earlier alternate draft, keep as reference only             |

## Primary Route Map

| Area       | Stitch source                         | Current route                    | App files to map onto                                                                                                                                                            | Preserve                                                                  |
| ---------- | ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Public     | `landing_page_2/`                     | `/`                              | `apps/web/src/app/page.tsx`                                                                                                                                                      | Public CTA links and demo-safe navigation                                 |
| Auth       | `login_2/`                            | `/login`                         | `apps/web/src/app/(auth)/login/page.tsx`, `apps/web/src/app/(auth)/login/login-form.tsx`                                                                                         | Login body shape, dummy hash timing behavior, session handling            |
| Auth       | `signup_2/`                           | `/signup`                        | `apps/web/src/app/(auth)/signup/page.tsx`, `apps/web/src/app/(auth)/signup/signup-form.tsx`                                                                                      | Consent requirements, signup zod schema, no session issuance              |
| Auth       | `verify_email_2/`                     | `/verify-email`, `/email/verify` | `apps/web/src/app/(auth)/verify-email/page.tsx`, `apps/web/src/app/(auth)/email/verify/page.tsx`, `apps/web/src/app/(auth)/email/verify/verify-form.tsx`                         | Token verification flow and envelope handling                             |
| Auth       | `forgot_password_2/`                  | `/forgot-password`               | `apps/web/src/app/(auth)/forgot-password/page.tsx`                                                                                                                               | Password reset request API body and timing behavior                       |
| Auth       | `reset_password_2/`                   | `/reset-password`                | `apps/web/src/app/(auth)/reset-password/page.tsx`                                                                                                                                | Reset token and password schema                                           |
| Catalog    | `supervisors_2/`                      | `/supervisors`                   | `apps/web/src/app/(public)/supervisors/page.tsx`                                                                                                                                 | Search query params, filter names, public-only data                       |
| Catalog    | `supervisor_profile_2/`               | `/supervisors/[id]`              | `apps/web/src/app/(public)/supervisors/[id]/page.tsx`                                                                                                                            | Public profile data only, no encrypted/private fields                     |
| Supervisee | `my_requests_2/`                      | `/requests`                      | `apps/web/src/app/(supervisee)/requests/page.tsx`                                                                                                                                | Current user ownership and status labels                                  |
| Supervisee | `new_request_2/`                      | `/requests/new`                  | `apps/web/src/app/(supervisee)/requests/new/page.tsx`, `apps/web/src/app/(supervisee)/requests/new/new-request-form.tsx`                                                         | Existing request creation body, PHI server validation, deid gate          |
| Supervisee | `work_surface_2/`                     | `/requests/[id]`                 | `apps/web/src/app/(supervisee)/requests/[id]/page.tsx`                                                                                                                           | Owner/supervisor/admin access rules, case files panel, status transitions |
| Supervisee | `payments_2/`                         | `/payments`, `/payments/[id]`    | `apps/web/src/app/(supervisee)/payments/page.tsx`, `apps/web/src/app/(supervisee)/payments/[id]/page.tsx`, `apps/web/src/app/(supervisee)/payments/[id]/refund-request-form.tsx` | Dev Toss flow, refund request schema, receipt data                        |
| Supervisee | `settings_2/`                         | `/settings`                      | `apps/web/src/app/(supervisee)/settings/page.tsx`                                                                                                                                | TOTP/session/password security behavior                                   |
| Supervisor | `dashboard_2/`                        | `/supervisor`                    | `apps/web/src/app/(supervisor)/supervisor/page.tsx`                                                                                                                              | Supervisor-only guard and existing queue metrics                          |
| Supervisor | `request_queue_2/`                    | `/supervisor/requests`           | `apps/web/src/app/(supervisor)/supervisor/requests/page.tsx`                                                                                                                     | PHI-minimized queue list and status filters                               |
| Supervisor | `work_surface_2/`                     | `/supervisor/requests/[id]`      | `apps/web/src/app/(supervisor)/supervisor/requests/[id]/page.tsx`, `apps/web/src/app/(supervisor)/supervisor/requests/[id]/request-workflow.tsx`                                 | Existing PHI access path, accept/reject/feedback/completion bodies        |
| Supervisor | `supervisor_profile_2/`               | `/supervisor/profile`            | `apps/web/src/app/(supervisor)/supervisor/profile/page.tsx`                                                                                                                      | Profile form wiring and visibility/verification policy                    |
| Supervisor | `qualifications_2/`                   | `/supervisor/qualifications`     | `apps/web/src/app/(supervisor)/supervisor/qualifications/page.tsx`                                                                                                               | Qualification status semantics and upload-stub boundary                   |
| Supervisor | `payments_2/` as nearest pattern      | `/supervisor/products`           | `apps/web/src/app/(supervisor)/supervisor/products/page.tsx`                                                                                                                     | Product CRUD API shape and price constraints                              |
| Supervisor | `availability_2/`                     | `/supervisor/availability`       | `apps/web/src/app/(supervisor)/supervisor/availability/page.tsx`                                                                                                                 | Slot schema, timezone, weekday/time validation                            |
| Admin      | `admin_dashboard_2/`                  | `/admin`                         | `apps/admin/src/app/page.tsx`                                                                                                                                                    | Admin guard, TOTP requirement, no PHI body exposure                       |
| Admin      | `qualifications_2/`                   | `/admin/qualifications`          | `apps/admin/src/app/admin/qualifications/page.tsx`                                                                                                                               | Admin reason 30+ characters and existing approval/reject APIs             |
| Admin      | `payments_2/` as refund queue pattern | `/admin/refunds`                 | `apps/admin/src/app/(admin)/refunds/page.tsx`, `apps/admin/src/app/admin/refunds/page.tsx`                                                                                       | Refund queue only, no automatic refund expansion                          |
| Admin      | `payouts_2/`                          | `/admin/payouts`                 | `apps/admin/src/app/(admin)/payouts/page.tsx`, `apps/admin/src/app/admin/payouts/page.tsx`                                                                                       | Existing payout compute/list semantics                                    |

## Screens Without A Direct Route

| Stitch source                      | Use                                                               |
| ---------------------------------- | ----------------------------------------------------------------- |
| `clinicalsup_authentication_flow/` | Flow/copy reference only; not mounted as a route                  |
| `clinical_trust_system/DESIGN.md`  | Design rationale and visual language reference                    |
| `*_1/` folders                     | Earlier alternate drafts; compare only if `_2` is missing a state |

## In-App Routes Without A Dedicated Stitch Screen

| Route                    | Current source to borrow from    | Reason                                         |
| ------------------------ | -------------------------------- | ---------------------------------------------- |
| `/supervisor/products`   | `payments_2/` card/list pattern  | Stitch bundle has no product-management screen |
| `/admin/refunds`         | `payments_2/` queue/list pattern | Stitch bundle has no dedicated refund queue    |
| Error/loading boundaries | Nearest route shell              | Stitch bundle focuses on happy-path screens    |

## Implementation Boundaries

Allowed changes:

- Page JSX structure
- Tailwind utility classes
- UI copy, labels, helper text, and status label rendering
- Small route-local presentational helper components

Forbidden changes:

- API route handlers
- Database schema, migrations, RLS policies
- `withUserContext`, `phiAccess`, PHI encryption/decryption paths
- Session/auth guard behavior
- zod schemas and request/response envelope shape
- Demo seed semantics
