# AGENTS.md

## ClinicFlow Origin-14 Design Rule

This repository's current ClinicFlow frontend must be completed from the approved 14 origin screens, not from older Apple drafts, generic SaaS templates, or later route screenshots that drifted from the origin set.

Active source-of-truth hierarchy:

- UI/UX source of truth: `docs/ui-ux/clinicflow-origin14-design-system.md`
- Current design contract: `docs/ui-ux/clinicflow-current-design-contract.md`
- Route alignment ledger: `docs/ui-ux/clinicflow-route-alignment-manifest.md`
- IA/navigation plan: `docs/ui-ux/clinicflow-ia-navigation-refactor-plan.md`
- Historical archive: `docs/_archive/**` is non-authoritative.

Old Stitch prompts, old MVP prompts, old design handoff docs, and legacy Netlify docs are historical reference only. Do not use them as current visual, architecture, or deployment instructions.

`apps/web` and `apps/admin` are separate Next.js apps. Do not create parallel AppShell/navigation systems; extend the existing shells and account/navigation components unless the user explicitly approves a replacement.

Posteady may be used only as a structural reference for desktop workbench IA; Origin-14 remains the visual baseline. See `docs/ui-ux/clinicflow-posteady-structural-reference.md`.

Origin-14 is the baseline, not the ceiling. It prevents regression into generic AI card UI, but it must not block clearer desktop workbench layouts.

Desktop app chrome, stable side navigation, denser tables, smaller workbench headers, and tighter spacing are allowed when they improve clarity. Do not preserve large rounded panels, oversized hero typography, or floating card sidebars merely because they resemble old Origin-14 screenshots.

Highest-priority UI source of truth:

- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/01-home-home.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/02-supervisors-supervisors.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/03-login-login.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/04-guide-guide.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/05-request-new-request-new.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/06-material-upload-material-upload.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/07-request-detail-request-detail.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/08-payments-payments.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/09-waiting-waiting.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/10-case-archive-case-archive.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/11-supervisor-dashboard-supervisor-dashboard.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/12-supervisor-workspace-supervisor-workspace.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/13-admin-qualifications-admin-qualifications.png`
- `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/14-admin-admin.png`

Supporting source files:

- `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`
- `demo-evidence/rebuild-tech-ui/README.md`
- `demo-evidence/rebuild-tech-ui/SCREENSHOT_MANIFEST.md`

Hard implementation rules:

- Treat the 14 screenshots as the baseline design system, not as a separate comparison set or a ceiling that blocks clearer desktop workbench UI.
- The user's broader design prompt is "Minimalist Modern": clarity through structure, bold electric-blue detail, generous whitespace, restrained surfaces, confident hierarchy, and premium motion. Apply that prompt only where it supports the 14 origin screens.
- For Korean ClinicFlow screens, preserve the origin-14 typography character: Noto Sans KR first, deep slate text, electric blue action/highlight, thin borders, white or near-white surfaces. Do not replace the origin style with Calistoga/portfolio-like English typography unless the user explicitly approves a new design direction.
- Every new or existing route must extend one of those 14 archetypes.
- Do not revive older Apple-style drafts, Stitch/Material-like surfaces, generic SaaS dashboards, KPI strips, card-heavy admin pages, or legacy fallback screens.
- Global headers may contain only public navigation: `ClinicFlow`, `슈퍼바이저 찾기`, `이용 가이드`, `로그인`, and the start CTA when appropriate.
- Workflow-specific entries such as `자료 제출`, `자료 업로드`, `결제`, `수락 대기`, `학습 기록`, `검토`, and `운영` must stay inside the relevant page, not in the global header.
- Prefer one line per item, one primary action per page state, and at most one fixed side summary panel.
- Avoid nested cards, repeated panels, naked-number metrics, empty placeholder blocks, oversized border radius, heavy shadows, and generic AI-looking filler copy.
- When screenshots differ from the 14 origin set, the 14 origin set wins unless the user explicitly approves a new design direction.
- Later explicit user corrections to architecture or workflow clarity also count as binding refinements. Current binding refinement: `/requests/new` must not pretend that material upload happens on the same screen as draft creation. It extends the origin `새 슈퍼비전 의뢰` archetype, but the active step is `세션·일정`, the primary action is `신청 초안 저장`, and actual material organization continues on `/requests/[id]#case-files`.
- Third-pass binding refinement: `/requests/[id]` must use one main detail column plus one fixed summary panel. Status and next action live in the summary panel; case material, schedule, feedback, and attachments live in grouped detail sections with clear separators. Learning-record content appears only for completion-record/completed states.
- Third-pass operational refinement: `/supervisor/requests`, `/admin/refunds`, `/admin/payouts`, and `/admin/audit` must stay row/table-first. Each row should expose status, amount or schedule, responsible user/actor when available, and at most one obvious row-level work control. Extra decision controls should be secondary or disclosed, not competing cards.
- Final IA label set: `케이스 아카이브`, `결제 내역`, `가능 시간`, `자격 정보`, `감사 로그`, `환불`, `정산`, and `대기열` are the current labels unless the user explicitly changes the IA again.

UI noise control:

- Every visible UI copy, card, panel, badge, and step bar must earn its place.
- Do not add generic `다음 행동` banners, summary cards, helper panels, or right-side panels by default.
- `PrimaryActionPanel` is exceptional, not a standard page structure; Origin-14 guard markers are not a reason to add `PrimaryActionPanel`, `SectionBlock`, or `AdminCard`.
- Side summary panels are allowed only when they reduce repeated information or support a user decision.
- Empty/loading/error states should be compact by default.
- Operational pages default to list/table/row layouts, not cards.
- Repeated helper text is UX debt.
- Desktop clarity is the target; mobile polish is out of scope.

Before changing UI:

1. Open the relevant origin screenshot.
2. Map the route to one origin archetype.
3. State which archetype is being extended.
4. Implement with the same typography, background, spacing, line-list structure, panel restraint, and CTA hierarchy.
5. Capture browser evidence or record the exact runtime blocker.

Before finalizing source-of-truth, route, navigation, or release-prep changes, run the relevant available checks such as `pnpm origin14:check`, `pnpm release:web:fast-check`, `pnpm release:admin:check`, typecheck, lint, or a narrower documented substitute when local Next/Node tooling is blocked.
