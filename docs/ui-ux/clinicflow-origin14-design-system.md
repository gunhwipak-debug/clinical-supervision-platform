# ClinicFlow Origin-14 Design System

Status: Binding UI/UX baseline
Source: `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400` and `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`
Last updated: 2026-06-15

## Authority

This document is the current UI/UX baseline source of truth for ClinicFlow.

Origin-14 is the baseline, not the ceiling. It prevents regression into generic AI card UI, but it must not block clearer desktop workbench layouts. Origin-14 screenshot structures may be improved when clarity, space density, or workbench usability improves. Public marketing/discovery pages may use preview surfaces, but authenticated work pages should be compact workbenches.

The approved Origin-14 PNG/screenshots are the highest-priority visual baseline. The static preview HTML is supporting evidence, not a replacement for the 14 approved screenshots.

Superseded historical sources include:

- old MVP prompts, including `docs/_archive/2026-06-15/old-prompts/codex-piped-quiche.md`
- old Stitch prompt packs and exports
- old design handoff files under `demo-evidence/`
- old audit reports that predate the Origin-14 contract
- legacy deployment docs under `docs/_archive/**`

Operational pages must not regress into generic card-heavy AI UI, old Apple-style surfaces, Stitch/Material-style screens, or dashboard filler.

This document must stay synchronized with:

- `apps/web/src/components/clinicflow-shell.tsx`
- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/app-navigation.tsx`
- `apps/admin/src/components/admin-shell.tsx`
- `apps/admin/src/components/admin-account-menu.tsx`

This document is the highest-priority baseline design system for ClinicFlow frontend work. The Origin-14 screenshots define the product's approved visual language and interaction rhythm, but not every old surface pattern must be preserved. They are QA and visual-regression evidence for avoiding drift into older Apple drafts, generic SaaS templates, and card-heavy AI UI.

## 1. Product Design Principle

ClinicFlow is a clinical supervision workflow product.

It helps hospital and center practitioners find a supervisor, organize case materials, submit a request, receive supervision feedback, and keep a learning record. Every page must help the user understand where they are in that flow and what to do next.

ClinicFlow is not:

- a generic SaaS landing page
- a decorative dashboard
- a metric-card product
- an Apple-style clone
- a card-heavy admin console
- a security jargon showcase
- a developer-facing workflow tool

The canonical service flow is:

1. 슈퍼바이저 찾기
2. 세션 선택
3. 일정 선택
4. 사례 자료 업로드
5. 확인·결제
6. 수락 대기
7. 슈퍼비전·검토
8. 피드백 확인
9. 학습 기록

The interface must stay workflow-first. A screen is successful only when it answers:

- What is this page?
- What is the current state?
- What has already happened?
- What is the next action?
- What information supports that next action?

## 2. Visual Identity

### Typography

- Primary Korean font: `Noto Sans KR`.
- Secondary/system fallback: `Inter`, `system-ui`, `sans-serif`.
- Origin tone: bold, clear, quiet, structured.
- Page title:
  - Desktop public/hero pages may stay large, heavy, and tight.
  - Desktop workbench pages should use smaller, more proportional headers when density improves clarity.
  - Typical range: 48-72px for public/hero pages, 32-44px for authenticated workbench pages.
  - Use deep slate/ink.
- Section title:
  - 24-32px, bold.
  - Never compete with the page title.
- Body:
  - 15-16px, 1.65-1.8 line-height.
  - Use `word-break: keep-all` for Korean explanatory copy when needed.
- Labels and metadata:
  - 12-14px, bold or semibold.
  - Muted color, short Korean words.

### Color Palette

Core tokens from the Origin preview:

| Token          | Value                             | Use                                             |
| -------------- | --------------------------------- | ----------------------------------------------- |
| Ink            | `#081225`                         | Main text, brand dot, deep panels               |
| Navy           | `#071226`                         | Dark primary action panels and public flow band |
| Muted          | `#667085`                         | Supporting text                                 |
| Line           | `#e7ebf1`                         | Borders and dividers                            |
| Blue           | `#2563ff`                         | Primary CTA, active step, key highlight         |
| Blue soft      | `#eef4ff`                         | Badges, small selected states                   |
| Panel          | `#ffffff`                         | Cards, forms, side summaries                    |
| Page           | `#ffffff`                         | Default background                              |
| Warning accent | `#cb6f12` text / `#f3cf85` border | Waiting, review-required, admin attention       |

Color rules:

- Blue is for real action or active workflow state. Do not use it as decoration.
- Navy panels are reserved for blocking next-action guidance or public flow bands. They are not the default state container.
- Orange/warning accent is reserved for pending/review states.
- Public and workflow pages use white/near-white backgrounds with thin borders.
- Do not introduce large gradients, decorative blobs, or unrelated accent palettes.

### Spacing Scale

The Origin system uses generous but disciplined spacing:

- Page max width:
  - Public and workflow: `1120px`.
  - Header: `1180px`.
  - Admin/list pages: `1120px`.
- Page horizontal gutter:
  - Desktop: 48px total minimum (`calc(100% - 48px)`).
  - Mobile: 24-32px.
- Header height:
  - 64px fixed/floating public header.
- Page top padding:
  - Public hero: about 96px from header region.
- Workflow screens in old static preview had 96-110px top breathing space, but desktop workbench routes may use tighter spacing.
- App route implementation should prefer stable app chrome, compact page headers, and table/list density over preserving large empty surfaces.
- Section rhythm:
  - Page intro to next component: 32-48px.
  - Step indicator to content: 28-32px.
  - Row list item vertical padding: 20-28px.
  - Side panel inner padding: 24-32px.

Spacing rules:

- Whitespace must separate decisions, not create empty spectacle.
- Do not use `min-h-screen` on sparse inner workflow sections just to fill the viewport.
- A page should not contain a large empty area below the main action unless content is intentionally complete.

### Border Radius

Origin radius is restrained and professional:

- Public header: 18px.
- Main panels and lists: 12-16px.
- Step indicators: 14-16px.
- Buttons: 12-14px.
- Small badges: 8-10px.
- Avatars/dots only: round/full.
- Special public visual cards may reach 20-24px, but operational workbench surfaces should stay flatter and tighter.

Avoid:

- large `rounded-3xl` surfaces
- nested rounded cards
- pill-shaped workflow panels
- toy-like soft UI

### Border and Shadow Usage

- Borders are thin and visible: `1px solid #e7ebf1`.
- Use shadows sparingly:
  - Floating public header: `0 12px 28px rgba(15, 23, 42, 0.08)`.
  - Primary CTA: subtle blue shadow only.
  - Public hero preview cards: light depth.
- Workflow and admin list rows should rely more on borders/dividers than shadows.
- Do not stack shadows inside shadows.

### Background and Surface Usage

- Default page background is white.
- Panel background is white.
- Input/soft areas may use very light slate/blue.
- Dark navy panels are intentional landmarks, not default containers.
- Avoid glassmorphism except the public floating header.

### CTA Hierarchy

- One primary action per page state.
- Primary action:
  - Blue background, white text.
  - Button copy must be a concrete verb phrase.
  - Examples: `슈퍼바이저 찾기`, `자료 업로드하기`, `결제하고 신청 완료`, `첫 요청 열기`, `피드백 제출`.
- Secondary action:
  - White background, thin border, dark text.
  - Used for back, guide, criteria, or low-risk alternatives.
- Tertiary action:
  - Inline link or line-row affordance.
- Do not show multiple blue CTAs competing in the same viewport.

## 3. Minimalist Modern for ClinicFlow

Minimalist Modern is a secondary reference, not a replacement for Origin-14.

ClinicFlow's interpretation:

- Clarity through structure: every route starts with a clear page intro, current state, and next action.
- Character through blue detail: electric blue is concentrated in the active step, main CTA, and headline emphasis.
- Generous whitespace with dense rows: pages breathe, but decision items are line-based and scannable.
- Premium without spectacle: subtle shadows, thin borders, strong typography, restrained motion.
- Clinical seriousness: no playful blobs, excessive rounded cards, decorative KPI bands, or abstract fake dashboards.
- Motion as feedback only: hover/focus/transition can clarify interaction, but continuous decorative animation is not required for clinical workflow screens.

What to adapt from the Minimalist Modern prompt:

- bold hierarchy
- confident electric-blue detail
- intentional inverted navy sections
- subtle elevated surfaces
- crisp section rhythm

What not to copy:

- Calistoga or portfolio-like English display typography
- broad gradient text as the default style
- decorative hero objects unrelated to supervision
- pricing/testimonial/SaaS template sections

## 3.1 ClinicFlow Desktop Workbench v2

ClinicFlow Desktop Workbench v2 is the current target for authenticated and operational pages.

- Fixed desktop app chrome is allowed when it improves orientation.
- Role sidebars may become stable rails instead of floating rounded cards.
- Workbench headers may be smaller than old Origin-14 screenshots.
- Tables, rows, and compact empty states may override oversized card spacing.
- Public pages may keep a strong visual opening, but authenticated work pages should feel like precise desktop software.
- Origin-14 still blocks generic SaaS filler, naked metrics, nested cards, and older Apple/Stitch visual drift.
- animated statistics or vanity metrics

## 4. Origin-14 Layout Archetypes

Each Origin-14 screen is a reusable archetype. New routes must extend one of these archetypes.

### A01. Public Home

Source: `01-home-home.png`, `#home`

Purpose: explain ClinicFlow in one glance and move users toward supervisor search or process understanding.

Structure:

- Floating public header.
- Left: badge, oversized headline, one concise paragraph, primary + secondary CTA.
- Right: realistic request preview showing current request, supervisor, material status, next action.
- Dark navy flow band with four concrete workflow moments.

Rules:

- No raw metrics or KPI strips.
- No PHI/LOG/internal acronyms.
- The hero preview must show the real clinical-supervision flow, not an abstract product mockup.

### A02. Supervisor Search

Source: `02-supervisors-supervisors.png`, `#supervisors`

Purpose: help users compare and choose a supervisor.

Structure:

- Page intro with badge and direct title.
- Horizontal search/filter strip.
- Supervisor cards with image, name, credentials, expertise, short intro.
- One clear action toward starting a request.

Rules:

- Cards are allowed here because comparison is the task.
- Each card must support fit judgment.
- Do not place payment or upload actions inside the card.

### A03. Login

Source: `03-login-login.png`, `#login`

Purpose: let users enter their supervision workspace calmly.

Structure:

- Two-column layout.
- Left: large human headline and one short reassurance sentence.
- Right: compact login form panel.

Rules:

- Do not add marketing clutter around the login form.
- Do not hide login failure messages.
- After login, route the user to the correct role landing page.

### A04. Guide

Source: `04-guide-guide.png`, `#guide`

Purpose: explain the complete supervision journey and preparation guidance.

Structure:

- Page intro.
- Horizontal 9-step journey.
- Lower practical guidance blocks.

Rules:

- Use user-facing workflow language, not principles or database states.
- Resources belong here when they help the user prepare a request.
- Do not make a separate sparse resource page if the content is just request preparation.

### A05. New Request

Source: `05-request-new-request-new.png`, `#request-new`

Purpose: start a request draft and show selected supervisor/session/schedule.

Structure:

- Page intro with step indicator.
- Left: line-list of selected items.
- Right: fixed side summary.
- One primary action to continue to material upload.

Rules:

- `/requests/new` must not pretend actual material upload happens on the draft screen.
- Active step should be `세션·일정` or the current selection step.
- Primary action should be `신청 초안 저장` or the next step based on state.

### A06. Material Upload

Source: `06-material-upload-material-upload.png`, `#material-upload`

Purpose: organize questions and files for supervision.

Structure:

- Page intro and step indicator.
- Dark navy instruction panel.
- Upload drop zone.
- Submission checklist.
- Fixed side summary.
- File rows below.

Rules:

- Keep upload, questions, and checklist visually connected.
- Do not scatter material upload, payment, and review actions in the same priority level.
- File rows must be line-based.

### A07. Request Detail

Source: `07-request-detail-request-detail.png`, `#request-detail`

Purpose: show current state and the next required action.

Structure:

- Status badge, title, short state sentence.
- Step indicator.
- Dark navy primary action panel.
- One or two support blocks.
- Fixed side summary.

Rules:

- The first viewport must make the current state and next action obvious.
- Deep editing tools belong lower on the page or behind section anchors.

### A08. Payment

Source: `08-payments-payments.png`, `#payments`

Purpose: confirm selected content and complete payment.

Structure:

- Page intro and step indicator.
- Large line-list confirmation panel.
- Amount/status aligned to the right.
- Primary action for payment completion.

Rules:

- Explain what is being paid for.
- Avoid payment-system jargon.
- Do not mix payment with unrelated dashboard widgets.

### A09. Waiting

Source: `09-waiting-waiting.png`, `#waiting`

Purpose: reassure the user after payment/material submission while supervisor acceptance is pending.

Structure:

- Page intro and step indicator.
- Dark navy current-state panel.
- Fixed side summary.
- One secondary route to status/detail.

Rules:

- Do not create fake progress or filler metrics.
- State that there is nothing else to enter unless the supervisor requests it.

### A10. Case Archive

Source: `10-case-archive-case-archive.png`, `#case-archive`

Purpose: organize completed supervision as learning history.

Structure:

- Page intro.
- Folder/tree list: supervisor folder -> case/client -> record rows.
- Fixed side summary for selected record.

Rules:

- This is not a file dump.
- Use OneNote-like hierarchy.
- Avoid nested cards; use indentation, dividers, and rows.

### A11. Supervisor Queue

Source: `11-supervisor-dashboard-supervisor-dashboard.png`, `#supervisor-dashboard`

Purpose: show the supervisor what to process next.

Structure:

- Page intro.
- Queue header with concise filters.
- Line-list request rows.
- One primary action to open the first request.

Rules:

- No naked number dashboard.
- Counts are allowed only as small filters attached to the queue.
- Prioritize actionable items: new material, acceptance decision, feedback draft, response needed.

### A12. Supervisor Workspace

Source: `12-supervisor-workspace-supervisor-workspace.png`, `#supervisor-workspace`

Purpose: review one case and write feedback.

Structure:

- Page intro.
- Dark navy next-action panel.
- Left: case summary / feedback draft.
- Right: fixed review summary.
- One primary action: submit or continue feedback.

Rules:

- The workspace must focus on one request.
- Avoid tool-like clutter above the case context.

### A13. Admin Qualification Review

Source: `13-admin-qualifications-admin-qualifications.png`, `#admin-qualifications`

Purpose: review supervisor qualification evidence.

Structure:

- Page intro.
- List-first evidence rows.
- Dark navy criteria panel.
- One primary action: open first review or complete decision.

Rules:

- Admin may be denser, but not raw or ugly.
- Display operational reason and evidence clearly.

### A14. Admin Operation List

Source: `14-admin-admin.png`, `#admin`

Purpose: show operations that need admin intervention.

Structure:

- Page intro.
- List-first operation rows.
- Dark navy operational summary.
- One primary action for urgent handling.

Rules:

- Do not use card-heavy admin grids.
- Do not expose raw system internals unless the route is explicitly audit/debug for admins.

## 5. Route Mapping

### Public Web Routes

| Route                  | Required archetype             | Notes                                                                                                           |
| ---------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `/`                    | A01 Public Home                | Real workflow hero, public header, no metric band.                                                              |
| `/supervisors`         | A02 Supervisor Search          | Comparison cards allowed.                                                                                       |
| `/supervisors/[id]`    | A02 Supervisor Search extended | Profile detail should support fit decision; one primary request CTA.                                            |
| `/guide`               | A04 Guide                      | 9-step flow plus material preparation guidance.                                                                 |
| `/resources`           | A04 Guide extended             | Keep useful prep resources; avoid sparse standalone cards. Consider merging with guide if content remains thin. |
| `/clinical-guidelines` | A04 Guide extended             | Educational reference layout; no generic blog cards.                                                            |
| `/terms`               | A04 Guide/legal variant        | Readable legal content with clear sections.                                                                     |
| `/privacy`             | A04 Guide/legal variant        | Plain Korean, avoid security theater.                                                                           |
| `/security`            | A04 Guide/legal variant        | User-facing safety language, not internal acronyms.                                                             |
| `/sensitive-consent`   | A04 Guide/legal variant        | Consent explanation in plain Korean.                                                                            |

### Auth Routes

| Route              | Required archetype | Notes                                                  |
| ------------------ | ------------------ | ------------------------------------------------------ |
| `/login`           | A03 Login          | Two-column calm login surface.                         |
| `/signup`          | A03 Login extended | Account creation should stay compact and task-focused. |
| `/forgot-password` | A03 Login extended | Single recovery task.                                  |
| `/reset-password`  | A03 Login extended | Single password reset task.                            |
| `/email/verify`    | A03 Login extended | Clear state and next action.                           |
| `/verify-email`    | A03 Login extended | Clear state and next action.                           |

### Supervisee Routes

| Route               | Required archetype                    | Notes                                                                          |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| `/requests`         | A07 Request Detail / A11 queue hybrid | List active requests by next action; no dashboard stats.                       |
| `/requests/new`     | A05 New Request                       | Draft and selection only; upload continues on request detail/material section. |
| `/requests/[id]`    | A07 Request Detail                    | Current state first, primary action panel, side summary.                       |
| `/payments`         | A08 Payment list variant              | Payment rows tied to requests.                                                 |
| `/payments/[id]`    | A08 Payment                           | Single payment detail.                                                         |
| `/payments/confirm` | A08 Payment                           | Final confirmation and payment CTA.                                            |
| `/case-archive`     | A10 Case Archive                      | Supervisor folder -> case -> record.                                           |
| `/notifications`    | A07 Request Detail list variant       | Notifications grouped by next action, not a generic inbox.                     |
| `/settings`         | A03 Login/form variant                | Calm account form sections, no workflow navigation.                            |

### Supervisor Routes

| Route                        | Required archetype                     | Notes                                                     |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------- |
| `/supervisor`                | A11 Supervisor Queue                   | Queue-first, action-first.                                |
| `/supervisor/requests`       | A11 Supervisor Queue                   | Status filters attached to list only.                     |
| `/supervisor/requests/[id]`  | A12 Supervisor Workspace               | One case, one next action, fixed review summary.          |
| `/supervisor/memory`         | A10 Case Archive variant               | Human learning/context folder, not raw memory/debug data. |
| `/supervisor/profile`        | A02/A03 form variant                   | Profile editing plus preview, not dashboard.              |
| `/supervisor/products`       | A05 form/list variant                  | Use `슈퍼비전 방식` / `세션 유형`, line-list options.     |
| `/supervisor/availability`   | A05 form/list variant                  | Schedule setup with one save action.                      |
| `/supervisor/payouts`        | A08 payment/admin list variant         | Payout status rows, no payment jargon overload.           |
| `/supervisor/qualifications` | A13 Admin Qualification Review variant | Evidence/status review for own qualification.             |
| `/me`                        | A03/A05 form variant                   | Account identity and role summary.                        |

### Admin App Routes

| Route                   | Required archetype                             | Notes                                                              |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| `/`                     | A14 Admin Operation List                       | Admin entry should lead to operation list or login state.          |
| `/admin`                | A14 Admin Operation List                       | Main admin queue.                                                  |
| `/admin/queue`          | A14 Admin Operation List                       | Consolidated operation queue.                                      |
| `/admin/qualifications` | A13 Admin Qualification Review                 | List-first review, criteria side panel.                            |
| `/admin/refunds`        | A14 Admin Operation List / A08 Payment variant | Refund rows by user impact and next decision.                      |
| `/admin/payouts`        | A14 Admin Operation List / A08 Payment variant | Payout rows and decision status.                                   |
| `/admin/audit`          | A14 Admin Operation List dense variant         | Audit can be denser, but still readable and user-facing for admin. |
| `/payouts` in admin app | A14/A08 variant                                | Treat as admin payout list if retained.                            |
| `/refunds` in admin app | A14/A08 variant                                | Treat as admin refund list if retained.                            |

## 6. Navigation Architecture

### Public Header

Allowed public header items:

- `ClinicFlow`
- `슈퍼바이저 찾기`
- `이용 가이드`
- `로그인`
- `슈퍼비전 신청하기` when appropriate

Rules:

- Public header may be floating and lightly blurred.
- Public header must not include workflow-step links.
- Do not show `자료 제출`, `자료 업로드`, `결제`, `수락 대기`, `학습 기록`, `검토`, `운영` in the public global header.
- A compact menu can exist on small screens, but it must expose public navigation only.

### Authenticated Role Screens

Rules:

- Authenticated pages should minimize global navigation.
- The header may show `ClinicFlow`, role label, account menu, and logout/profile access.
- Workflow navigation belongs inside the page: step indicator, queue filters, line-list rows, side summary.
- Do not use a persistent sidebar unless the page is a genuinely dense workspace and the sidebar reduces confusion.
- Role navigation may appear as a compact pathfinder, but it must not become the screen's main visual object.
- Account menu must expose role, profile/settings access, and logout.
- Utility items such as settings, help, and logout have lower visual priority than current workflow actions.

### Role Navigation Menu Sets

These are information architecture groups, not a mandate to show a full sidebar everywhere.

Supervisee:

- 내 의뢰
- 새 슈퍼비전 의뢰
- 결제 내역
- 학습 기록
- 알림
- 계정 설정

Supervisor:

- 검토할 의뢰
- 사례 검토
- 기록 폴더
- 프로필
- 슈퍼비전 방식
- 가능 일정
- 정산 내역
- 자격 심사

Admin:

- 운영 처리 목록
- 운영 대기열
- 자격 심사
- 환불 심사
- 정산 확인
- 처리 기록

Rules:

- Use these sets to support role-specific wayfinding.
- Do not put all items in the public global header.
- On workflow pages, the current page content should be more prominent than role navigation.
- If a sidebar is used, width should be 220-260px, font size 14-16px, with clear current-location treatment.
- On mobile, collapse role navigation into a compact menu or top/bottom minimal navigation.

### Sidebar and Topnav

Use sidebar/topnav only when:

- the user needs to move between peer-level workspaces repeatedly, and
- the sidebar does not compete with the current page's primary action.

Do not use sidebar/topnav when:

- the workflow itself is sequential,
- the page already has a step indicator,
- the screen is for 50-60대 users who need a single clear path,
- the nav creates more choices than the current state needs.

## 7. Multi-step Flow Rules

Use these rules for request creation, material upload, payment, waiting, and learning record flows.

Required:

- Show current step and total step count in text.
- Show the current step title.
- Apply `aria-current="step"` to the active step.
- Completed, active, and pending states must be visually distinct.
- The step indicator may be horizontal on desktop and condensed on mobile.
- The step indicator is progress context, not a replacement for the page title.

Button meaning:

- `저장`: temporary save only. It must not imply final submission.
- `다음`: move to the next step after required inputs are valid.
- `제출`: confirm and submit the request/material state.
- `결제`: start or complete payment.
- `수정`: return to a previous step without losing context.

Flow-specific rules:

- `/requests/new` is for request draft and session/schedule selection.
- Actual material upload continues on `/requests/[id]#case-files`.
- The final confirmation screen must summarize supervisor, session, schedule, material status, and amount.
- Waiting state must reassure the user that no additional action is needed unless the supervisor requests it.
- Learning record appears after feedback/completion, not as a generic file page.

## 8. Component Rules

### Page Intro

Required:

- optional small badge/eyebrow
- large title
- one short subtitle
- optional one primary action aligned right on desktop

Do not:

- place multiple CTAs in the intro
- use abstract slogans
- use internal state names

### Step Indicator

Required for request/payment/waiting/workflow pages.

Rules:

- Show clear user-facing step names.
- Active step uses blue fill.
- Completed/pending steps remain visually quiet.
- Keep it horizontal on desktop and readable on mobile.
- It is navigation context, not a button menu unless explicitly implemented as such.

### Primary Action Panel

Use only when the user may be blocked without explicit next-action guidance. Using a dark navy primary action panel is optional and exceptional, not a standard required page structure. Stateful pages do not automatically need dark action panels.

Rules:

- Optional dark navy background (`theme="dark"`) or light border background (`theme="light"`).
- Small badge only when it adds meaning. Prefer a specific state/action label such as `현재 상태`, `업로드 준비`, or `결제 필요`; avoid generic `다음 행동`.
- Strong title.
- One short explanatory paragraph.
- Optional one action button.

Do not:

- put long instructions in the dark panel
- place several primary actions inside it
- use it as decorative filler
- add it only because a route needs an Origin-14 guard marker

### Line-List Row

Default pattern for requests, payments, supervisor queue, admin operations.

Rules:

- One row equals one decision item.
- Use dividers, not nested cards.
- Left: label/status, title, one description.
- Right: status/amount/owner and one action.
- Avoid 2x2 card grids for workflow lists.

### Fixed Side Summary Panel

Use only when it compresses repeated facts or supports a concrete decision.

Rules:

- Right column on desktop, below content on mobile.
- Sticky only when useful.
- Contains selected supervisor/session/schedule/material/payment/status.
- Uses short label-value rows.
- No repeated copy from the main content.
- Do not add a side panel to balance whitespace.

### Folder / Tree List

Use for learning records and memory/context archives.

Rules:

- Parent: supervisor folder.
- Child: case/client.
- Leaves: feedback, supplement, completion record.
- Use indentation and dividers.
- Avoid nested cards.

### Review Queue

Use for supervisor/admin processing lists.

Rules:

- Queue first.
- Small filters may show counts only when attached to the queue.
- No standalone KPI cards.
- First actionable item should be easy to open.

### Form Section

Rules:

- Group fields by task.
- Keep one save/continue action per section.
- Explain required fields in plain Korean.
- Long forms should use progressive disclosure or clear section headings.

### Empty, Error, and Loading States

Rules:

- Empty state must be compact by default and say what is missing.
- Error state must say what the user can do now.
- Loading state should be inline or row-sized unless a blocking page-level load requires a prominent state.
- Do not expose `500`, `API`, `DB`, `payload`, `token`, `route`, or stack details to ordinary users.

## 9. UX Writing Rules

Use:

- concise Korean
- user-facing workflow language
- concrete verbs
- one next action per screen
- status labels that describe what the user can understand

Avoid:

- internal terms: `PHI`, `LOG`, `DB`, `API`, `JSON`, `UUID`, `payload`, `token`, `webhook`, `schema`, `route`, `slug`, `auth`, `callback`, `mutation`, `query`, `cache`, `cron`, `debug`, `deployment`, `middleware`
- vague SaaS copy
- motivational filler
- principle labels on user pages
- security theater when security is not the user's current task

Preferred wording:

| Internal/weak              | Use instead                           |
| -------------------------- | ------------------------------------- |
| request                    | 의뢰 / 신청                           |
| product                    | 세션 유형 / 슈퍼비전 방식 / 제공 항목 |
| case material              | 사례 자료                             |
| completion record          | 이수 기록 / 학습 기록                 |
| awaiting_supervisor_review | 슈퍼바이저 확인 대기                  |
| additional_info_requested  | 추가 자료 요청됨                      |
| feedback_submitted         | 피드백 도착                           |
| server error               | 일시적인 문제가 발생했습니다          |
| permission denied          | 접근 권한이 없습니다                  |

## 10. Anti-Patterns

The following are explicitly prohibited unless the user approves a new design direction:

- nested cards inside cards unless explicitly justified (nested Card inside Card is prohibited)
- 2x2 or 3x3 card grids for operational lists or work queues (must use flat rows or tables instead)
- meaningless metrics or naked-number stat strips
- dashboard filler
- card-heavy admin pages (operational admin pages must stay table/list/row-first)
- oversized rounded cards that feel toy-like
- heavy shadows on workflow surfaces
- workflow items in the global header
- material upload, payment, and review actions all competing in one viewport
- old Apple-style designs
- generic SaaS landing sections that do not explain ClinicFlow
- public homepage PHI/LOG/internal acronyms
- raw database state names in user-facing UI
- security/privacy claims written as technical jargon
- empty panels used only to balance layout
- large decorative mockups that do not represent the supervision workflow

## 11. Implementation Checklist

Before creating or modifying any ClinicFlow UI route:

1. Identify the route and user role.
2. Select exactly one primary Origin-14 archetype from this document.
3. Confirm the page's single next action.
4. Confirm workflow items are inside page content, not the global header.
5. Use `Noto Sans KR`, deep ink text, electric blue CTA, thin border, white surface.
6. Use a page intro with title, short subtitle, and at most one primary action.
7. If the page is sequential, use the step indicator.
8. Use a primary action panel only when the user would otherwise be blocked. Its usage is optional and not a required boilerplate marker.
9. Use one fixed side summary panel only when it reduces repetition or supports a decision.
10. If the page lists work, use line-list rows, not dashboard cards.
11. If the page stores learning records, use folder/tree hierarchy.
12. Remove nested cards unless a card is the atomic comparison item.
13. Remove meaningless metrics and decorative counters.
14. Remove internal/technical terms from user-facing copy.
15. Check the desktop 1440x1000 workflow first; mobile polish is out of scope unless explicitly requested.
16. Check accessibility: headings, labels, focus states, contrast, no color-only status.
17. Compare against this document first.
18. Use Origin-14 screenshots only for QA/visual regression after the document check passes.

## 12. Change Governance

This document outranks ad-hoc visual memory and older design drafts.

If a future design appears inconsistent with the Origin-14 screenshots, this document wins unless the user explicitly approves a new direction.

If this document and a screenshot appear to disagree:

1. Prefer the screenshot for exact visual evidence.
2. Update this document only after confirming the intended rule.
3. Do not silently introduce a third style.

If a route cannot be completed because of Next/Node build instability:

- keep UI/UX work moving using static preview and route-level source changes
- document the runtime issue as Release hygiene
- do not block Origin-14 UI implementation on `next build`
