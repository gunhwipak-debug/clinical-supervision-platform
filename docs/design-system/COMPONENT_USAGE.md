# ClinicFlow Component Usage

Status: active component guidance  
Last updated: 2026-06-15

This document records component usage rules only. It does not introduce new components or implementation behavior.

## Source Relationship

Current visual rules come from:

- `AGENTS.md`
- `docs/ui-ux/clinicflow-origin14-design-system.md`
- `docs/ui-ux/clinicflow-current-design-contract.md`

Current implementation primitives include:

- `apps/web/src/components/clinicflow-shell.tsx`
- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/app-navigation.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/admin/src/components/admin-shell.tsx`

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

## Task List

Use task lists when the page must show ordered next work.

Good uses:

- supervisor dashboard
- additional-material requests
- request detail next action
- admin operation home

Task lists should make the next action visible without relying on naked metric cards.

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

## Empty, Error, and Locked States

Empty/error/locked states must follow the same Origin-14 language:

- concise Korean copy
- one recovery action
- no technical jargon unless the page is admin-only and the detail is necessary
- no legacy fallback visual language
