# EPIC 4 Decisions

## PHI Access Scope

`phiAccess: true` is now limited to TOTP secret operations from EPIC 1 and case packet encrypted columns in EPIC 4. Case packet write/read paths set the PHI GUC only when handling `title_enc`, `chief_complaint_enc`, and `referral_reason_enc`; supervision request metadata, deidentification checklist, status transitions, list views, and deletes keep PHI access unset.

## Status Machine

The supervision request state machine lives in `packages/shared/src/supervision/status-machine.ts` so API routes, UI affordances, and future workers can share one pure TypeScript rule set without DB coupling. EPIC 4 defines only draft/submitted/cancelled/deleted/expired transitions; EPIC 6+ must extend the map when payment and downstream workflow states become active.

## Supervisor Assignment

`supervisor_id` is set at draft creation by resolving `service_product_id -> supervisor_profile_id -> user_id`. This makes assigned-supervisor RLS useful immediately and avoids showing draft request metadata to unrelated supervisors. The alternative was assignment at acceptance, but that would weaken EPIC 4 access boundaries.

## PHI Regex

The server blocks Korean RRN, mobile phone, email, and long bank-account-like numeric sequences. Postal codes and Korean name-like titles such as `홍길동 평가` are intentionally not matched here because SEC-DEID-03 filename/name heuristics are a separate future layer. Client-side detection only warns; server-side `assertNoPhi` is the source of truth.

## Retention Default

The UI defaults to 30 days because it is the middle MVP retention option and matches the representative flow in the plan. Users can still choose 7 or 90 days, and the DB enforces the same set with a CHECK constraint.

## Case Packet And Delete Model

Case packets are treated as one logical row per supervision request; PUT has upsert semantics at the application layer. Draft deletion is hard delete, including its packet/checklist, because drafts have not entered payment or supervision workflows. Submitted or later requests must use cancellation or later deletion-request workflows.

## Unresolved

File upload, PHI scanning of file contents, filename name heuristics, payment transition to `awaiting_payment`, supervisor accept/reject, notifications, and system expiry workers remain for EPIC 5/6/8/11. Admin mutation routes are also deferred; admins can inspect with reason, while supervisee-owned mutation remains the EPIC 4 route policy.
