# ClinicFlow Tech Style Preview

This folder is a safe static UI/UX preview for the ClinicFlow rebuild direction.
It is not a production route implementation and it is not deployment evidence.

## Current Source

- HTML preview: `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`
- Desktop screenshot: `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/rebuild-tech-ui/clinicflow-home-tech.png`
- Mobile screenshot: `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/rebuild-tech-ui/clinicflow-home-tech-mobile.png`
- Evidence manifest: `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/rebuild-tech-ui/SCREENSHOT_MANIFEST.md`

## Design Direction

- Reference rhythm: `designprompts.dev/saas` Tech Style, translated into ClinicFlow's clinical supervision context.
- Tone: modern SaaS polish, but calm, professional, education-oriented, and not a generic sales page.
- Homepage hierarchy: what ClinicFlow is, who uses it, what the user does next, and what the supervision flow looks like.
- Header: a floating fixed header with direct public links only: `ClinicFlow`, `슈퍼바이저 찾기`, `이용 가이드`, `로그인`, and the start CTA when appropriate. It must not expose workflow-step links such as 자료 제출, 결제, 수락 대기, or 학습 기록.
- Primary workflow: `슈퍼바이저 찾기 -> 세션 선택 -> 일정 선택 -> 사례 자료 업로드 -> 확인·결제 -> 수락 대기 -> 슈퍼비전·검토 -> 피드백 확인 -> 학습 기록`.

## What Was Cleaned Up

- Removed template-like artifacts such as loose metrics, abstract hero props, generic filler blocks, and number bands.
- Removed user-facing internal/security jargon and security-as-marketing copy from this preview.
- Standardized the professional role wording as `슈퍼바이저`.
- Merged standalone resource-page content into the guide as practical application guidance.
- Restored the material upload section as a visible workflow state.
- Added the normal `수락 대기` state between payment confirmation and review.
- Changed the learning record section into a OneNote-like hierarchy: supervisor folder -> client/case -> record.
- Replaced supervisor dashboard filler with an action-oriented request queue.

## Preview Coverage

The single HTML file includes static sections for:

- `#home`
- `#supervisors`
- `#login`
- `#guide`
- `#request-new`
- `#material-upload`
- `#request-detail`
- `#payments`
- `#waiting`
- `#case-archive`
- `#supervisor-dashboard`
- `#supervisor-workspace`
- `#admin-qualifications`
- `#admin`

## Verification Results

- Current blocklist scan passes for the preview HTML and evidence notes.
- Static scan found no anchor tags missing `href`, no images missing `alt`, and no record leaves without links.
- Visual scan passes for oversized radii, heavy shadows, and gradient decorations in the preview HTML.
- `git diff --check` passed for this folder's text files.
- Guide flow check confirmed exactly nine steps in the intended order.
- Chrome headless generated the desktop and mobile home screenshots listed above.

## Guardrail

The wider worktree currently contains modified production app and route files outside this
static evidence folder. Those files are not part of this preview handoff and must be
reviewed separately before any commit, deploy, or production implementation.

When applying this concept to real routes later, preserve existing authentication,
authorization, request ownership, database queries, payment logic, and admin actions.
Restyle rendered states progressively instead of replacing protected routes with
static shells.
