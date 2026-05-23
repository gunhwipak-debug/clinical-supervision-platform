# Stitch Pixel Transposition

## Scope

This pass treats `designs/stitch/stitch_clinical_trust_auth_redesign/*/code.html`
as the visual source of truth. Backend routes, API handlers, database queries,
RLS policies, `withUserContext`, `phiAccess`, zod schemas, and status-machine
logic were not changed.

## Principle Self-Check

| Principle                  | Status | Note                                                                                                                                                                 |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Body source of truth       | Pass   | Route pages render the original Stitch `<body>` payload through `StitchResponsivePage`.                                                                              |
| No shadcn primitives       | Pass   | Transposed pages import no shadcn primitives.                                                                                                                        |
| Tailwind coverage          | Pass   | `pnpm verify:stitch-coverage` reports `849` classes, `0` missing.                                                                                                    |
| Material Symbols preserved | Pass   | Material Symbols is self-hosted via `@fontsource/material-symbols-outlined`; no lucide substitution in transposed pages.                                             |
| Material token names       | Pass   | Tailwind exposes original names such as `primary`, `surface-container-high`, and `on-surface-variant`.                                                               |
| Style blocks extracted     | Pass   | All 51 Stitch `<style>` blocks are appended to `globals.css` under `Stitch extracted source styles`.                                                                 |
| Script behavior            | Pass   | Tailwind config scripts are replaced by build-time tokens. User actions are restored through a capture-phase event delegation layer without rewriting Stitch markup. |
| `_1`/`_2` handling         | Pass   | Each route renders `_1` for `md+` and `_2` for mobile via `hidden md:block` / `md:hidden`.                                                                           |
| Backend unchanged          | Pass   | No API, DB, RLS, PHI, or auth guard files were edited.                                                                                                               |
| No abstraction first pass  | Pass   | Only the minimal Stitch body renderer is shared; page-specific markup remains sourced per Stitch file.                                                               |

## Token Mapping

| DESIGN.md token                                                  | Tailwind/CSS variable                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `surface`, `surface-dim`, `surface-bright`                       | `--color-surface`, `--color-surface-dim`, `--color-surface-bright`                      |
| `surface-container-*`                                            | `--color-surface-container-*`                                                           |
| `on-surface`, `on-surface-variant`                               | `--color-on-surface`, `--color-on-surface-variant`                                      |
| `primary`, `primary-container`, `primary-fixed`                  | `--color-primary`, `--color-primary-container`, `--color-primary-fixed`                 |
| `secondary`, `secondary-container`, `secondary-fixed`            | `--color-secondary`, `--color-secondary-container`, `--color-secondary-fixed`           |
| `tertiary`, `tertiary-container`, `tertiary-fixed`               | `--color-tertiary`, `--color-tertiary-container`, `--color-tertiary-fixed`              |
| `error`, `outline`, `background`                                 | `--color-error`, `--color-outline`, `--color-background`                                |
| `display-lg`, `headline-lg`, `headline-md`, `body-*`, `label-*`  | `--text-*` and `--font-*` theme tokens                                                  |
| `rounded.sm/default/md/lg/xl/full`                               | `--radius-sm`, `--radius`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full` |
| `spacing.base/xs/sm/md/lg/xl/gutter/margin-mobile/container-max` | `--spacing-*` theme tokens                                                              |

## Page Mapping

| Stitch source             | Route                        | Integration       |
| ------------------------- | ---------------------------- | ----------------- |
| `landing_page_1/_2`       | `/`                          | Responsive split  |
| `signup_1/_2`             | `/signup`                    | Responsive split  |
| `login_1/_2`              | `/login`                     | Responsive split  |
| `verify_email_1/_2`       | `/verify-email`              | Responsive split  |
| `forgot_password_1/_2`    | `/forgot-password`           | Responsive split  |
| `reset_password_1/_2`     | `/reset-password`            | Responsive split  |
| `supervisors_1/_2`        | `/supervisors`               | Responsive split  |
| `supervisor_profile_1/_2` | `/supervisors/[id]`          | Responsive split  |
| `my_requests_1/_2`        | `/requests`                  | Responsive split  |
| `new_request_1/_2`        | `/requests/new`              | Responsive split  |
| `payments_1/_2`           | `/payments`                  | Responsive split  |
| `settings_1/_2`           | `/settings`                  | Responsive split  |
| `dashboard_1/_2`          | `/supervisor`                | Responsive split  |
| `request_queue_1/_2`      | `/supervisor/requests`       | Responsive split  |
| `work_surface_1/_2`       | `/supervisor/requests/[id]`  | Responsive split  |
| `availability_1/_2`       | `/supervisor/availability`   | Responsive split  |
| `qualifications_1/_2`     | `/supervisor/qualifications` | Responsive split  |
| `payouts_1/_2`            | `/supervisor/payouts`        | New UI-only route |
| `admin_dashboard_1/_2`    | `/admin` in admin app        | Responsive split  |

## Style Extraction

All Stitch `<style>` blocks from the 39 `code.html` files were extracted into:

- `apps/web/src/app/globals.css`
- `apps/admin/src/app/globals.css`

The extraction includes page-specific helpers such as `bg-pattern`,
`hide-scrollbar`, `calendar-scroll`, `icon-fill`, `slot-btn`, and
`wizard-step`.

## Script Handling

Most Stitch scripts are CDN Tailwind configuration scripts. Those are replaced
by local Tailwind v4 tokens and `@source` scanning.

Inline demo/form scripts are not executed directly. Instead,
`apps/web/src/components/stitch/stitch-interactivity.tsx` attaches capture-phase
listeners to each `[data-stitch-page]` root. This preserves the original Stitch
DOM and classes while restoring:

- login, signup, password forgot, password reset form submission;
- hash-link navigation and demo CTA routing;
- mobile new-request wizard step toggles with the original `active`/`hidden`
  class changes;
- request create → case packet → deidentification → submit flow;
- supervisor work-surface accept/reject/feedback/completion shortcuts;
- receipt print action and password visibility toggles.

The listener layer intentionally stores no PHI and does not alter API handlers,
zod schemas, auth guards, RLS, or `phiAccess` rules.

## Material Symbols

Material Symbols is kept as text glyphs:

```html
<span class="material-symbols-outlined">medical_information</span>
```

The font is self-hosted with `@fontsource/material-symbols-outlined/400.css`.

## Authentication Flow Diagram

`clinicalsup_authentication_flow` is a routing/reference diagram. It is included
in Tailwind coverage, but it is not mounted as an app route.

## Verification

- `pnpm typecheck`: pass
- `pnpm lint`: pass
- `pnpm build`: pass
- `pnpm verify:stitch-coverage`: pass, `missingClassCount: 0`
- Playwright screenshots: `demo-evidence/screenshots/stitch-pixel/`

## Known Limits

- Stitch pages now have core form/button wiring, but they still use the static
  Stitch body as the visual shell. Domain-rich editing surfaces that were not
  present in the Stitch export remain minimal click-through affordances rather
  than fully redesigned product forms.
- Original Stitch screenshots have different source dimensions than the
  Playwright evidence viewport, so final fidelity review should compare
  proportions and layout first, then request viewport-specific recaptures if
  exact pixel-diff scoring is needed.
