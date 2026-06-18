# ClinicFlow Component Usage

Status: active component guidance
Last updated: 2026-06-15

This document records component usage rules only. It does not introduce new components or implementation behavior.

## Source Relationship

Current visual rules come from:

- `AGENTS.md`
- `docs/design-system/CLINICFLOW_DESIGN_JUDGMENT.md`
- `docs/ui-ux/clinicflow-origin14-design-system.md`
- `docs/ui-ux/clinicflow-current-design-contract.md`

Current implementation primitives include:

- `apps/web/src/components/clinicflow-shell.tsx`
- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/app-navigation.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/admin/src/components/admin-shell.tsx`

Origin-14 is the baseline, not the ceiling. It prevents regression into generic AI card UI, but it must not block clearer desktop workbench layouts.

The StyleSeed-informed experiment adds a design-judgment layer: one ClinicFlow accent, grayscale discipline, restrained radius/shadow, compact workbench type, and explicit surface hierarchy. It is not a permission to copy a Toss/Stripe/Linear/Raycast/Vercel skin or to convert clinical workflows into generic dashboards.

## Card

Use a card only when it has one clear purpose and one primary decision.

Good uses:

- login form container
- supervisor profile summary
- compact side summary
- a single review/locked/empty state

Avoid cards for:

- dense request queues
- admin processing lists
- multi-step workflow bodies
- repeated KPI blocks
- nested panels
- unrelated information grouped only to fill space

StyleSeed note: card/background separation matters, but ClinicFlow operational work does not require every item to become a floating card. Row and table frames remain first-class workbench surfaces.

### Strict Anti-Grid and Nesting Rule:

- **Never place cards in a grid layout (e.g. 2x2, 3x3)** to represent operational lists or audit queues. Use flat Line Lists or dense Tables instead.
- **Nested Card inside Card is strictly prohibited** unless explicitly justified and approved by the user.
- **SectionBlock must not contain nested Cards** as page content layout wrappers.

## Line List / Entity List

Use line-based rows when users need to scan, compare, or continue work.

Good uses:

- request lists
- payment history
- supervisor review queue
- learning records
- admin queue items
- payout/refund rows

Each row should contain:

- one clear title
- one short supporting line
- a status or next action when needed

## Table / Admin Table

Use tables when operators need dense comparison across repeated records.

Good uses:

- admin audit rows
- payout batches
- refund queues
- qualification review history

Do not use decorative card grids for admin work queues.

Table and list density may override oversized Origin-14 card spacing when the user is doing operational work. Use smaller page headers, tighter row padding, and clearer column hierarchy instead of adding explanatory cards.

## Task List

Use task lists when the page must show ordered next work.

Good uses:

- supervisor dashboard
- additional-material requests
- request detail next action
- admin operation home

Task lists should make the next action visible without relying on naked metric cards.

## PrimaryActionPanel

Use only for a blocking next action that would otherwise be unclear. It is optional and exceptional, not a required boilerplate marker to satisfy the guard.

- exceptional, not default
- no generic default eyebrow such as `다음 행동`
- one title, one short sentence, one action
- not a route-alignment marker filler
- **Supports Light Theme**: Use the optional `theme` prop. Avoid high-contrast dark navy layouts (`theme="dark"`) by default unless a strict process block is in effect. Prefer `theme="light"` (border and light background) for cleaner integration with workspace screens.

## SectionBlock

Use to group real sections, not as a generic rounded card wrapper.

- subtitle is optional
- omit subtitles that restate the heading
- prefer dividers and rows inside a single surface for workflow details

## Side Summary Panel

Use only when it removes repetition or supports a user decision.

Right summary panels are exceptional. Static metadata belongs in compact top status bars unless the side panel directly supports a decision.

Supervisor request detail pages are review workspaces, not summary dashboards. Static request metadata belongs in a compact top status bar. Do not use a right summary rail when it narrows the primary review area.

Good uses:

- selected item details
- payment totals
- current status facts
- decision support for review/approval

Avoid:

- repeating the page description
- balancing empty whitespace
- explaining what the main list already shows

## FlowStepNav

Use for transaction routes only.

Do not use it on archive/list pages when it becomes decorative.

## Settings Section

Settings pages should be line-by-line and compact.

Use:

- section title
- short description
- one editable form area or row group

Avoid:

- dashboard-style cards
- large hero panels
- repeated account summary cards

## Public vs Operational Pages

Public browsing pages may use a strong hero, public header, and explanatory sections.

Operational pages should be calmer and denser:

- no giant marketing hero
- no generic SaaS stat strips
- no repeated card grids
- one primary action per page state
- one side summary panel at most

## Desktop App Chrome

Authenticated pages may use stable desktop app chrome instead of floating rounded sidebar cards.

- Sidebar width should stay around 220-260px.
- Sidebar can use a full-height rail, subtle right border, and flat background.
- Floating sidebar cards are not required.
- PageHeader should be proportional to workbench pages, not marketing hero.
- Public landing hero may be visually strong, but authenticated work pages should be compact.

StyleSeed coherence rules for app chrome:

- one active-state accent
- subtle border over visible shadow
- smaller operational radius
- stable row height and target size
- no decorative gradients or random elevation

## Empty, Error, and Locked States

Empty/error/locked states must follow the same Origin-14 language:

- concise Korean copy
- one recovery action
- compact variant by default
- prominent variant only for onboarding, public guidance, or important blocking states
- no technical jargon unless the page is admin-only and the detail is necessary
- no legacy fallback visual language

## AdminCard / Operational Lists

Use `AdminCard` for compact summaries or single-purpose support areas only.

- not for operational rows
- not for audit/refund/payout main lists when a table/list frame is enough
- not for repeated dashboard-like cards
