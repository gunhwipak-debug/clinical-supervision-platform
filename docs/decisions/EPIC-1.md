# EPIC 1 Auth Decisions

## Token Storage

- Decision: use a dedicated `auth_tokens` table for email verification and password reset tokens.
- Reason: token lifecycle, one-time consumption, TTL, and audit metadata stay separate from `users` without adding broad nullable columns.
- Storage: issue 32 random bytes as base64url plaintext, store only SHA-256 hex in `auth_tokens.token_hash`.
- TTL: email verification 24 hours, password reset 1 hour, TOTP setup window 10 minutes.
- Alternative considered: a unified user-token JSON column. Rejected because it is harder to enforce single-use and query expired tokens safely.

## TOTP Secret Encryption

- Decision: keep using the existing `users.totp_secret_enc` column and encrypt/decrypt through `encryptPhi`/`decryptPhi`.
- Reason: TOTP secrets are credential material and should follow the existing PHI-key gated database path.
- Operational rule: only `/api/auth/totp/enroll`, `/api/auth/totp/verify`, and `/api/auth/totp/disable` call `withUserContext(..., phiAccess: true)`.
- Non-TOTP auth paths keep `phiAccess` omitted so `app.phi_key` is never set for login, logout, signup, email verify, password forgot, or password reset.

## Recovery Codes

- Decision: store 8 recovery codes in `totp_recovery_codes`, one row per code.
- Storage: plaintext is returned once at enrollment, DB stores SHA-256 hex only.
- One-time use: `consumed_at` marks a code as spent; disable consumes the matching code and then consumes all remaining active codes.
- Alternative considered: encrypted recovery codes. Rejected for this EPIC because verification only needs a hash comparison and plaintext recovery is never needed after enrollment.

## Mailer

- Decision: add `Mailer`, `DevConsoleMailer`, and `getMailer()` in `packages/shared/src/email/mailer.ts`.
- Reason: EPIC 1 needs deterministic token delivery in development without introducing Resend or another external provider.
- Future adapter point: EPIC 11 can replace `getMailer()` with an environment-selected Resend adapter while preserving the `Mailer.send(payload)` contract.

## Signup Response Model

- Decision: active duplicate email signup returns the same `{ ok: true }` response as a new signup after one dummy password hash.
- Reason: this avoids email enumeration and keeps response timing closer than returning `409 email_taken`.
- Alternative considered: explicit `409 email_taken`. Rejected for the public signup route because it leaks account existence.
- Timing note: response envelope is matched, but timing is not perfectly matched; this path does not perform a fake token insert or fake mailer send.

## Deferred Items

- OAuth for Kakao/Naver remains excluded because T-107/T-108 require external console registration.
- Terms versions are not seeded in migrations; operations must seed active `tos`, `privacy`, and `sensitive` versions before public signup.
- Real outbound email sender/domain verification is deferred to EPIC 11.
- Admin route-level TOTP enforcement remains a guard stub only; actual admin route blocking belongs to EPIC 10.
- Password strength scoring with zxcvbn is deferred; this EPIC enforces length plus numeric and special-character requirements only.
