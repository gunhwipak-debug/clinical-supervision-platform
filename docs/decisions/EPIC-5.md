# EPIC 5 Files Decisions

## Storage Target

EPIC 5 uses `packages/shared/src/storage` as the storage boundary and implements
`LocalStorageAdapter` first. Local files are written under `dev-data/storage`, while
the public API still follows the production-shaped flow: server issues a signed PUT
URL, client uploads bytes, client registers metadata, and the server creates the
`case_files` row.

The production target is a private Supabase Storage bucket. Browser clients should
never receive public bucket URLs; all upload and download access stays behind
server-issued signed URLs, request participation checks, audit logging, and short
TTLs. S3 remains an adapter fallback, but EPIC 5 planning assumes Supabase Storage
as the primary deployment path.

## Signed URL Model

Upload and download URLs are HMAC-signed tokens with short TTLs. Upload URLs expire
after 10 minutes and download URLs after 15 minutes. Download tokens include the
authorized actor id/role and are rechecked through `withUserContext` before bytes are
returned. `access_logs.signed_url_id` is populated for download URL issuance and
signed download reads.

## Upload Policy

The redefined EPIC 5 file workflow allows the evidence formats clinicians actually
exchange during supervision:

- Text: `.txt`, `.md`, `.markdown`, `.json`, `.csv`
- PDF: `.pdf`
- Images: `.png`, `.jpg`, `.jpeg`, `.webp`
- Korean office files: `.hwp`, `.hwpx`
- Office files: `.docx`, `.xlsx`

Executables, archives, disk images, unknown binaries, and MIME/extension mismatches
remain blocked with `unsupported_file_type`. Text files still run the existing EICAR
and PHI-regex pass; EICAR blocks, while identifier findings are recorded as
`phiScanStatus: suspicious` metadata without blocking original supervision evidence.
Non-text files are accepted as supervision evidence with `phiScanStatus: pending`
unless their magic number or metadata fails the lightweight safety gate.

Forced anonymization and OCR/body extraction are explicitly postponed. The product
must not imply that uploaded PDFs, images, HWP/HWPX, DOCX, or XLSX files have been
fully anonymized or OCR-scanned until that infrastructure exists.

## Internal Preview and Annotation

EPIC 5 stores preview and annotation metadata inside the application boundary:
`case_file_previews`, `case_file_annotations`, and document review cycles support
internal preview, supervisor comments, revision requests, revision uploads, feedback
approval, and stamped return tracking. External collaborative editing is out of
scope for this epic.

## Watermark and Stamp

Text-based downloads receive a visible prefix containing viewer email, timestamp, and
supervision request id. Assessment completion uses a separate stamp flow: supervisor
feedback must be approved before the completion record is issued, then the stamped
return is tracked as a completed document review cycle. Counseling supervision can
complete from feedback without requiring an assessment stamp.

## Retention Cleanup

Expired files are cleaned by the system worker script
`pnpm files:purge-expired`. It uses the service-role database path outside PGlite
demo mode, selects `case_files` where `retention_expires_at <= now()` and
`deleted_at is null`, deletes the storage object, then marks the row with
`deleted_at`. The script also supports `--dry-run` for operations review before a
scheduled job is attached.

After stamped assessment completion, raw case files are scheduled for purge seven
days later. Final stamped return files are preserved as the completion artifact while
non-final raw evidence receives the `now() + interval '7 days'` retention deadline.

## Permissions

Uploads are supervisee-only and require an existing case packet. Current allowed
upload states are `draft`, `submitted`, and `in_review`; deletes are limited to
`draft` and `in_review`. Assigned supervisors can download files once RLS grants
request participation. Admin downloads require a 30+ character reason.

## Unresolved

Real Supabase bucket policy verification, KMS key rotation, ClamAV daemon deployment,
OCR/PDF/body PHI scanning, IP-bound signed URLs, and the external scheduler that
invokes retention cleanup remain future infrastructure work.

All user-facing copy around anonymization, raw-file retention, supervision
responsibility, and completion/stamp meaning requires legal copy review before
production launch. Mark unresolved policy language as `법률 검토 필요`.
