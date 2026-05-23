# STITCH-MIGRATION

## Decision

Stitch HTML exports are treated as visual source of truth for the UI migration. Existing route paths, API handlers, database queries, RLS policies, `withUserContext`, PHI access boundaries, session logic, and zod schemas are preserved. Stitch markup is translated into React JSX and wired to the existing server components or client forms.

## Asset Location

The uploaded Stitch zip was extracted into:

`designs/stitch/stitch_clinical_trust_auth_redesign/`

The mapping table is maintained in:

`designs/stitch/MAPPING.md`

## Token Mapping

| Semantic token     | Stitch source value | Notes                                    |
| ------------------ | ------------------- | ---------------------------------------- |
| `brand.700`        | `#131B2E`           | Primary navy / container                 |
| `brand.600`        | `#0058BE`           | Primary action blue / secondary          |
| `brand.500`        | `#2170E4`           | Emphasis blue / secondary container      |
| `brand.100`        | `#DAE2FD`           | Primary fixed                            |
| `brand.50`         | `#F0F3FF`           | Surface container low                    |
| `surface.base`     | `#F9F9FF`           | Background / surface                     |
| `surface.elevated` | `#FFFFFF`           | Surface container lowest                 |
| `surface.sunken`   | `#E7EEFF`           | Surface container                        |
| `ink.900`          | `#111C2D`           | On background / on surface               |
| `ink.700`          | `#45464D`           | On surface variant                       |
| `ink.500`          | `#76777D`           | Outline / muted text                     |
| `line`             | `#C6C6CD`           | Outline variant                          |
| `danger`           | `#BA1A1A`           | Error                                    |
| `warn`             | `#F59E0B`           | Rating star accent found in Stitch cards |

Stitch uses Hanken Grotesk and Inter via Google Fonts. The app keeps self-hosted Pretendard through `@fontsource/pretendard` to avoid external network dependency in build/test while preserving the same clinical SaaS hierarchy through weight, size, and spacing.

## Applied Routes

- `/`
- `/login`
- `/signup`
- `/verify-email`
- `/email/verify`
- `/forgot-password`
- `/reset-password`
- `/supervisors`
- `/supervisors/[id]`
- `/requests`
- `/requests/new`
- `/requests/[id]`
- `/payments`
- `/payments/[id]`
- `/settings`
- `/supervisor`
- `/supervisor/requests`
- `/supervisor/requests/[id]`
- `/supervisor/qualifications`
- `/supervisor/profile`
- `/supervisor/products`
- `/supervisor/availability`
- `/admin`
- `/admin/qualifications`
- `/admin/refunds`
- `/admin/payouts`

## Pending Routes

None for the Stitch bundle currently mapped to in-scope application routes. Remaining future work is refinement rather than unmapped source screens.

## Backlog From Stitch

Stitch contains screen affordances that are not current domain scope, including broad notification settings, biometric authentication, generic resources, invite/social affordances, and richer payment methods. These are not implemented. Existing domain behavior remains authoritative.

## Responsive Handling

Most `_2` Stitch screens are mobile-first. For desktop, the migration keeps Stitch section order and card structure, then expands width with existing Tailwind responsive utilities. No new route or alternate desktop-only domain behavior is introduced.
