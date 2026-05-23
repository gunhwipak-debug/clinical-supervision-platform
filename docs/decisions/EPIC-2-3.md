# EPIC 2-3 Profile, Catalog, Search Decisions

## Qualification Evidence Upload Stub

- Decision: expose only `packages/shared/src/storage/index.ts` with `StorageAdapter.prepareUpload`.
- Reason: EPIC 5 owns real object PUT, signed URL security, virus scan, PHI scan, and bucket policy hardening.
- Current behavior: `DevStorageAdapter` returns a `dev-storage://` upload key and does not write any object.
- Handoff: EPIC 5 should replace the adapter with the real qualifications bucket implementation and keep the same `prepareUpload` contract.

## Verification Status

- Decision: a supervisor profile becomes `approved` when at least one linked qualification is approved by an admin.
- Reason: MVP needs a simple operational rule that maps manual credential review to public search eligibility.
- Alternative considered: separate profile review plus qualification review. Deferred because it creates a second approval queue without current MVP value.

## Specialty Catalog

- Decision: seed 12 practical categories covering adult, child, neuropsych, personality, cognitive, projective, forensic, geriatric, trauma, addiction, autism, and learning disorder.
- Reason: these are broad enough for initial search while staying close to the MVP psych assessment scope.
- Operations: add or rename codes with a later migration or admin maintenance workflow; keep old codes stable once public URLs depend on them.

## Search Sorting

- Decision: default search sorting is `average_rating desc nulls last`.
- Reason: public discovery should prioritize perceived quality once reviews exist, while profiles with no rating should not outrank verified rated supervisors.
- Alternatives: response speed or completion count. Both remain explicit sort options.

## Supervisee Profile

- Decision: keep supervisee profile intentionally small: `display_name` and optional `headline`.
- Reason: the route supports a basic account-facing profile without collecting real name, phone, or clinical context.
- Storage: a new `supervisee_profiles` table avoids adding `users` columns and avoids PHI encryption for this EPIC.

## Availability Slots

- Decision: validate `weekday` 0-6 and `start_time < end_time`; duplicate identical slots are rejected in the API.
- Reason: database constraints catch invalid ranges, while full overlap detection can wait until booking semantics are introduced.
- Unresolved: whether overlapping but non-identical slots should be blocked; defer to EPIC 4 booking policy.

## Qualification Number

- Decision: EPIC 2-3 routes do not set `phiAccess=true`, so `qualifications.number_enc` is left `null`.
- Reason: the hard guardrail forbids PHI key GUC outside the existing TOTP routes in this goal. This conflicts with the later note about exposing own qualification number.
- Human confirmation needed: whether qualification number collection should be explicitly allowed in a later PHI-scoped patch.

## Deferred Items

- Real qualification evidence upload, signed URLs, storage writes, ClamAV, and PHI scanning remain EPIC 5.
- Admin UI, IP allowlist, and full admin route hardening remain EPIC 10.
- Domain flows after search, including supervision requests, case packets, payments, bookings, feedback, reviews, and completion records, remain out of scope.
