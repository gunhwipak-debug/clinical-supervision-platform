# ClinicFlow IA and Navigation Refactor Plan

Status: Implementation plan  
Source design standard: `docs/ui-ux/clinicflow-origin14-design-system.md`  
Last updated: 2026-06-15

This plan aligns ClinicFlow's information architecture, navigation, role access, and workflow UI with Origin-14. It intentionally separates UI/UX work from Release hygiene issues such as local `next build` hangs.

## 1. Current Information Architecture Problems

Observed issues from `report.md`, current routes, and recent UI review:

- Public header and authenticated navigation were not clearly separated.
- Logged-in users had insufficient account/role affordance, then later too much persistent role navigation.
- Workflow links such as material upload, payment, waiting, and learning record were at risk of appearing as global navigation instead of page-local progress.
- Request creation did not always make the difference between draft save, next step, final submit, and payment clear.
- Card grids were overused for lists that should be rows or tables.
- Supervisor work pages risked becoming dashboard filler instead of queue-first work surfaces.
- Admin pages risked becoming a card-heavy console instead of a list-first operation surface.
- Unauthorized route behavior must be explicit: login redirect for unauthenticated users, 403/role-required state for wrong-role users.
- Supervisor profile, availability, and product pages need resilient loading/error states.
- `next build`/Node instability has been observed and must not block UI implementation.

## 2. Navigation Architecture

### Public Navigation

Public header contains only:

- `ClinicFlow`
- `슈퍼바이저 찾기`
- `이용 가이드`
- `로그인`
- `슈퍼비전 신청하기` when appropriate

Public header must not contain:

- 자료 제출
- 자료 업로드
- 결제
- 수락 대기
- 학습 기록
- 검토
- 운영

### Authenticated Navigation

Authenticated screens use a minimal top shell:

- ClinicFlow logo/home link
- role label
- account menu
- logout/settings/profile access through account menu

Workflow navigation moves into the page:

- request pages use step indicator
- supervisor pages use queue filters
- admin pages use operation list rows
- archive/memory pages use folder tree

### Sidebar and Role Menu Policy

Use persistent sidebar only when it reduces confusion on dense role workspaces.

Allowed sidebar constraints:

- width: 220-260px
- font size: 14-16px
- grouped role items
- clear current page state
- utilities lower priority
- mobile collapses into compact menu

Do not use a sidebar when:

- the route is a sequential workflow
- the page already has a step indicator
- the sidebar competes with the primary action
- the page is public/login
- the route is intended for 50-60대 users who need a single clear next step

Initial implementation direction:

- Keep authenticated global shell minimal.
- Use page-local role links only in side summary panels or compact lower-priority lists.
- Re-introduce a sidebar later only for a truly dense admin/supervisor workspace after visual QA proves it reduces confusion.

## 3. Role Menu Structure

These are information architecture groups, not required persistent chrome.

### Supervisee

Primary:

- 내 의뢰
- 새 슈퍼비전 의뢰
- 결제 내역
- 학습 기록

Secondary:

- 알림
- 계정 설정
- 슈퍼바이저 찾기
- 이용 가이드

### Supervisor

Primary:

- 검토할 의뢰
- 사례 검토
- 기록 폴더

Setup:

- 프로필
- 슈퍼비전 방식
- 가능 일정
- 자격 심사

Finance:

- 정산 내역

### Admin

Primary:

- 운영 처리 목록
- 운영 대기열
- 자격 심사
- 환불 심사
- 정산 확인
- 처리 기록

Admin navigation should be list-first and task-first. It may be denser than public/supervisee pages, but it must not expose raw debug UI as the default experience.

## 4. Supervision Request Step Flow

Canonical flow:

1. 슈퍼바이저 선택
2. 세션 선택
3. 일정 선택
4. 사례 자료 업로드
5. 최종 확인
6. 결제
7. 수락 대기
8. 슈퍼비전·검토
9. 피드백 확인
10. 학습 기록

Origin-14 compressed workflow labels:

- 슈퍼바이저 선택
- 세션·일정
- 사례자료 정리 / 자료 업로드
- 확인·결제
- 수락 대기
- 슈퍼비전·검토
- 피드백 확인
- 학습 기록

Step indicator rules:

- Show current step and total step count.
- Show step title.
- Active step uses `aria-current="step"` and blue fill.
- Completed steps are visually distinct from pending steps.
- Do not use raw DB state names.

## 5. Button Semantics

| Button | Meaning                                  | Allowed examples                           |
| ------ | ---------------------------------------- | ------------------------------------------ |
| 저장   | Save draft without final submission      | `신청 초안 저장`, `임시 저장`              |
| 다음   | Move to next step after valid input      | `자료 업로드로 이동`, `최종 확인으로 이동` |
| 제출   | Commit the current workflow state        | `자료 제출`, `피드백 제출`                 |
| 결제   | Start or complete payment                | `결제하고 신청 완료`, `결제 확인`          |
| 수정   | Go back to revise without losing context | `선택 수정`, `자료 수정`                   |

Rules:

- `/requests/new` uses draft/session/schedule semantics.
- Actual material upload belongs at `/requests/[id]#case-files`.
- Payment screen must summarize what is being paid for before payment.
- Waiting screen must say whether the user has anything left to do.

## 6. Material Upload and Request Detail Relationship

`/requests/new`:

- creates or updates the request draft
- selects supervisor/session/schedule
- saves enough information to create a stable request id
- primary action: save draft or continue to material upload

`/requests/[id]#case-files`:

- uploads case files
- organizes questions and case summary
- shows checklist and material summary
- supports additional-material requests

`/requests/[id]`:

- shows current request state
- shows next action first
- exposes material, payment, feedback, and learning record sections based on status

Do not place upload, payment, supervisor review, and feedback authoring at the same priority in one viewport.

## 7. Card UI Replacement Plan

Routes where row/list/table should be preferred:

| Route                   | Replace card-heavy pattern with              |
| ----------------------- | -------------------------------------------- |
| `/requests`             | active request rows grouped by next action   |
| `/payments`             | payment rows tied to request and status      |
| `/case-archive`         | supervisor folder tree                       |
| `/notifications`        | notification rows grouped by required action |
| `/supervisor`           | queue-first request rows                     |
| `/supervisor/requests`  | review queue rows with compact filters       |
| `/supervisor/memory`    | folder/tree list                             |
| `/supervisor/payouts`   | payout rows                                  |
| `/admin`                | operation rows                               |
| `/admin/queue`          | operation queue rows                         |
| `/admin/qualifications` | evidence review rows                         |
| `/admin/refunds`        | refund decision rows                         |
| `/admin/payouts`        | payout decision rows                         |
| `/admin/audit`          | dense audit rows/table                       |

Cards remain acceptable for:

- `/supervisors` public comparison cards
- `/supervisors/[id]` profile sections
- compact form panels when one card has one purpose

## 8. Role Guard and Routing Policy

Unauthenticated:

- redirect/show login-required state
- preserve `returnTo`
- message says what login unlocks

Wrong role:

- show role-required or 403-style state
- do not silently redirect to settings or unrelated pages
- offer one safe route appropriate to the user's current role

Server-side:

- route loaders must check current user and role before reading protected data
- API routes must enforce the same role checks
- hiding menu items is not authorization

User-facing copy:

- `접근 권한이 없습니다`
- `이 화면은 슈퍼바이저 계정에서 사용합니다`
- `관리자 로그인이 필요합니다`

Avoid:

- raw `403`
- `auth`, `role_id`, `middleware`, `session_id`

## 9. Supervisor Profile, Availability, Products Error Plan

Target pages:

- `/supervisor/profile`
- `/supervisor/availability`
- `/supervisor/products`

Requirements:

- Page must load with a clear form or empty setup state.
- API errors should appear as user-facing inline messages.
- Loading states must preserve layout shape.
- Save buttons must show whether the action saved, failed, or still needs required fields.
- Form validation must use Korean messages and not raw schema/API text.

Expected page archetypes:

- profile: A02/A03 form variant with preview
- availability: A05 form/list variant
- products: A05 form/list variant using `슈퍼비전 방식`, `세션 유형`, `제공 항목`

## 10. E2E Verification Scenarios

These are the intended scenarios. If Next runtime/build blocks execution, record the blocker and verify through static preview/source-level checks where possible.

### Public

1. Home loads with Origin-14 public header and workflow hero.
2. Supervisor search shows comparison cards and one clear start action.
3. Guide shows the full supervision flow and material-prep guidance.

### Auth and Role Navigation

1. Login form accepts demo credentials and routes to the correct role home.
2. Account menu shows role, profile/settings, and logout.
3. Authenticated global header does not show workflow-step links.

### Supervisee Flow

1. `/requests/new` shows draft/session/schedule flow, not upload as same-screen final task.
2. `/requests/[id]#case-files` is the natural material upload destination.
3. Payment confirmation summarizes supervisor/session/schedule/material/amount.
4. Waiting state shows no extra action unless requested.
5. Case archive shows supervisor folder -> case -> record.

### Supervisor

1. `/supervisor` shows actionable queue first, not KPI cards.
2. `/supervisor/requests` groups review rows by required action.
3. `/supervisor/requests/[id]` opens one-case workspace with one primary feedback action.
4. Profile/availability/products load with clear empty/error/save states.

### Admin

1. `/admin` and `/admin/queue` show operation rows and one urgent action.
2. `/admin/qualifications` shows evidence rows and criteria panel.
3. `/admin/refunds`, `/admin/payouts`, `/admin/audit` remain dense but readable.

### Authorization

1. Wrong-role user sees role-required/403 state.
2. Unauthenticated protected route preserves return path.
3. Protected API routes reject unauthorized access.

## 11. Release Hygiene Blocker Separation

Do not block UI/UX work on `next build`.

Record as Release hygiene when:

- local Node/Next build hangs at optimization
- Vercel build/runtime differs from local
- Node version mismatch affects build stability
- `.nvmrc`, `engines`, or Vercel Node version alignment is needed

Recommended release hygiene follow-up:

- pin Node LTS with `.nvmrc`
- align `package.json` `engines`
- align Vercel Node runtime
- inspect Next build worker/native dependency behavior
- keep UI changes verifiable through typecheck/static preview/browser screenshots when full build is blocked

## 12. Implementation Order

1. Freeze Design System and IA plan.
2. Simplify authenticated shell and account menu.
3. Align supervisee request flow and material upload relationship.
4. Align payment, waiting, and case archive.
5. Align supervisor queue and workspace.
6. Align supervisor setup pages error/loading/save states.
7. Align admin list-first pages.
8. Align public pages.
9. Run available verification.
10. Record Release hygiene blockers separately.
