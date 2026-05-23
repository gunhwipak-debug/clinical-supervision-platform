# File Upload Safety Gate

## Decision

Closed beta uploads now allow the clinical evidence formats needed for EPIC 5:

- Text: `.txt`, `.md`, `.markdown`, `.json`, `.csv`
- PDF: `.pdf`
- Images: `.png`, `.jpg`, `.jpeg`, `.webp`
- Korean office files: `.hwp`, `.hwpx`
- Office files: `.docx`, `.xlsx`

Executables, archives, disk images, unknown binaries, and MIME/extension mismatches
remain blocked. Blocked files return `422 unsupported_file_type` before upload URL
issuance, local upload write, or metadata registration.

## Rationale

The current system can scan UTF-8 text with the existing PHI regex and EICAR test
content. Non-text files are accepted as supervision evidence, but forced
anonymization, OCR/PDF text extraction, and full body PHI detection are postponed.
The UI and policy copy must say this clearly; do not imply that accepted non-text
files have been automatically anonymized. 법률 검토 필요.

## Implementation Boundary

The file policy is enforced without a schema change. The server checks both filename
extension and Content-Type. Empty or `application/octet-stream` Content-Type is
allowed only when the extension is in the supported allowlist, and the server infers
the canonical MIME type.

The same policy is enforced at:

- upload URL issuance
- signed local upload token write
- file metadata registration

The production storage target is a private Supabase Storage bucket. Upload/download
access should remain server-mediated through signed URLs, RLS-backed request checks,
and audit logs. Internal preview and annotation can use app-managed preview objects,
but raw object URLs must not be exposed publicly.

Assessment completion follows the stamp flow: feedback approval is required before
issuing the completion record, then stamped completion schedules raw files for purge
after seven days while preserving the final return artifact. Counseling supervision
can complete without the assessment stamp. Legal copy review is required for the
retention and responsibility wording before launch.

## Deferred Work

EPIC 5 still needs a real scan pipeline:

- ClamAV daemon or equivalent malware scan
- OCR/PDF text extraction for PHI detection
- full body scanning for HWP/HWPX, DOCX, XLSX, image-derived text, and PDF text
- true page-level PDF watermarking
- Supabase private bucket policy verification
- retention purge verification against real Supabase Storage
