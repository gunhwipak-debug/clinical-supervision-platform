# Stitch Functional Mapping

## Purpose

The Stitch transposition pass created pages that look close to the supplied
designs, but some imported controls still behave like static mockup controls.
This document fixes the implementation contract for the next pass:

1. preserve the selected Stitch HTML as visual source material;
2. replace inert `href="#"` and fake buttons with real routes or real actions;
3. keep the existing backend, RLS, PHI, auth, file preview, annotation, and demo
   workflow intact.

## Source HTML

The source HTML files are preserved under:

`designs/stitch/manual-overrides/`

The same source samples are also bundled into one Markdown reference document:

`docs/decisions/STITCH-MANUAL-OVERRIDE-SOURCES.md`

| Source HTML                  | Target route                | Implementation rule                                                                                                                                        |
| ---------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supervisor-catalog.html`    | `/supervisors`              | Use the catalog layout, filters, and cards, but populate cards from the existing supervisor search data.                                                   |
| `supervisor-profile.html`    | `/supervisors/[id]`         | Use the bento profile layout and product/calendar sections, but bind data to the selected supervisor id.                                                   |
| `new-request.html`           | `/requests/new`             | Use the wizard layout, but keep the existing request creation body shape and validation.                                                                   |
| `availability-calendar.html` | `/supervisor/availability`  | Use the weekly calendar UI and persist slots per supervisor.                                                                                               |
| `availability-calendar.html` | public booking slot UI      | Display only the selected supervisor's available slots on profile/request booking surfaces.                                                                |
| `work-surface.html`          | `/supervisor/requests/[id]` | Use the review workspace frame while preserving in-app preview, watermark, annotations, feedback, revision request, approval, stamp, and completion flows. |

## Non-Negotiable Wiring Rules

- `href="#"` is not allowed on implemented product routes. Replace it with a
  real route, a real form action, or a disabled/non-action status element.
- Do not invent demo-only names, prices, ratings, request ids, file names, or
  appointment slots when real seed/application data exists.
- A visible button must either perform an action, navigate to a real page, or
  be visibly disabled with a clear reason.
- Do not remove useful mockup controls simply because they are currently fake.
  Prefer turning them into real workflow entry points.
- Keep the current backend contract. Do not modify RLS policies, PHI GUC paths,
  auth/session logic, DB schema, or migrations unless a later goal explicitly
  allows it.
- The existing preview and annotation implementation remains mandatory in the
  work surface. The supplied Stitch review screen is only the shell and layout.

## Functional Mapping

| Mockup control                              | Real behavior                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Find Supervisors`                          | `/supervisors`                                                                                |
| `My Requests`                               | `/requests`                                                                                   |
| `Secure Login`                              | `/login` or current account/session route if authenticated                                    |
| `프로필 보기`                               | `/supervisors/{supervisorId}`                                                                 |
| Supervisor profile `Back to Search Results` | `/supervisors`                                                                                |
| Supervisor profile `의뢰 신청하기`          | scroll/focus the selected supervisor's availability calendar first                            |
| Product `View Slots`                        | scroll/focus the selected supervisor's availability calendar first                            |
| Supervisor sidebar `Dashboard`              | `/supervisor`                                                                                 |
| Supervisor sidebar `Case Review`            | `/supervisor/requests`                                                                        |
| Supervisor sidebar `Profile`                | `/supervisor/profile`                                                                         |
| Supervisor sidebar `Services`               | `/supervisor/products`                                                                        |
| Supervisor sidebar `Schedule`               | `/supervisor/availability`                                                                    |
| Supervisor sidebar `Settings`               | `/settings`                                                                                   |
| Supervisor sidebar `Sign Out`               | existing logout/sign-out flow                                                                 |
| Work surface `목록으로`                     | `/supervisor/requests`                                                                        |
| Work surface `보완 요청`                    | existing revision-request action                                                              |
| Work surface `승인 및 완료`                 | assessment approval/stamp/completion flow when allowed; counseling completion when applicable |
| Work surface file row                       | open selected file in the in-app preview workspace                                            |
| Work surface annotation controls            | existing annotation create/list/resolve APIs                                                  |

## Availability Sync Decision

Supervisor availability is supervisor-specific. A slot created or toggled in
`/supervisor/availability` must be saved against that supervisor profile only.
Public profile and request booking surfaces must query slots for the selected
supervisor id and never show another supervisor's calendar.

The existing implementation already has `availability_slots`; prefer using that
path before adding schema. If the current API shape is insufficient, document the
gap first and use the smallest API/helper adjustment that preserves existing RLS
and demo behavior.

## Work Surface Decision

The supplied `work-surface.html` is a visual shell. It currently contains static
example PHI, static file names, and static review history. The implementation
must replace those with request-specific data and must not reintroduce fake PHI
or fake file names.

The center panel must include the existing document preview/annotation workspace:

- file list;
- selected file preview or derivative fallback;
- page watermark;
- coordinate-based annotations;
- feedback/revision/approval/stamp controls based on current request state.

## Public Booking Flow Decision

The profile CTA and product `View Slots` controls must not bypass scheduling.
They scroll to the selected supervisor's calendar preview first. The request
form opens only from a concrete calendar slot action that includes:

- `supervisorId`;
- `serviceProductId`;
- selected dated slot label.

This keeps `의뢰 신청하기` and `가능 일정 미리보기` separate: one is an entry
point into slot selection, and the calendar slot action is the actual request
creation entry point.

## Functional Wiring Audit

Updated: 2026-05-22.

Connected route/action replacements:

| Area                        | Imported mock control                   | Current implementation                                                        |
| --------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Catalog top nav             | `Find Supervisors`                      | `Link` to `/supervisors`.                                                     |
| Catalog top nav             | `My Requests`                           | `Link` to `/requests`.                                                        |
| Catalog/profile top nav     | `Resources`                             | `Link` to `/resources`.                                                       |
| Catalog/profile top nav     | `Secure Login`                          | `Link` to `/login`.                                                           |
| Catalog footer              | Privacy/terms/security/guidelines links | Real routes: `/privacy`, `/terms`, `/security`, `/clinical-guidelines`.       |
| Catalog qualification       | Qualification select                    | Connected to the existing public supervisor search qualification filter.      |
| Pagination                  | Catalog next/previous pages             | Connected to search offset/page query with next-page detection.               |
| Catalog cards               | `프로필 보기`                           | `Link` to `/supervisors/{supervisorId}`.                                      |
| Supervisor profile          | `Back to Search Results`                | `Link` to `/supervisors`.                                                     |
| Supervisor profile          | `의뢰 신청하기`                         | `Link` to the profile availability calendar; no direct request creation.      |
| Supervisor profile products | `View Slots`                            | `Link` to the profile availability calendar; no direct request creation.      |
| Supervisor console/sidebar  | `Dashboard`                             | `Link` to `/supervisor`.                                                      |
| Supervisor console/sidebar  | `Case Review`                           | `Link` to `/supervisor/requests`.                                             |
| Supervisor console/sidebar  | `Profile`                               | `Link` to `/supervisor/profile`.                                              |
| Supervisor console/sidebar  | `Services`                              | `Link` to `/supervisor/products`.                                             |
| Supervisor console/sidebar  | `Schedule`                              | `Link` to `/supervisor/availability`.                                         |
| Supervisor console/sidebar  | `Settings`                              | `Link` to `/settings`.                                                        |
| Work surface                | `목록으로`                              | `Link` to `/supervisor/requests`.                                             |
| Work surface                | `보완 요청`                             | Existing `revision-request` action, enabled only in API-supported states.     |
| Work surface                | `승인 및 완료`                          | Existing stamp/approval flow according to current request status.             |
| Work surface file rows      | Static attachment row action            | Opens the selected real case file in the in-app preview/annotation workspace. |

Explicitly removed rather than left as fake controls:

| Area                  | Control                     | Decision                                                                   |
| --------------------- | --------------------------- | -------------------------------------------------------------------------- |
| Catalog/profile icons | `security`, `notifications` | Removed from product routes until real security-center/inbox routes exist. |

Audit command:

```sh
rg -n "href=\{?['\"]#|href=\"#|href='#|REQ-2023-11-042|PT-8921-A|사례보고서_PT8921|4회기_축어록|Dr\. Kim" apps/web/src
```

Expected source result: no matches for the in-scope app routes. The preserved
source documents under `designs/stitch/manual-overrides/` and
`docs/decisions/STITCH-MANUAL-OVERRIDE-SOURCES.md` intentionally still contain
the original mockup HTML.

## Goal Prompt Draft

```text
/goal

[목표]
Clinical Supervision Platform — Stitch manual overrides를 실제 기능에 연결한다.
사용자가 선택한 Stitch HTML 5개를 source of truth로 보존했고, 이제 해당 레이아웃을 현재 백엔드와 실제 워크플로우에 맞게 적용한다.

작업 디렉터리:
/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform

[참조 파일]
- docs/decisions/STITCH-MANUAL-OVERRIDE-SOURCES.md
- designs/stitch/manual-overrides/supervisor-catalog.html
- designs/stitch/manual-overrides/supervisor-profile.html
- designs/stitch/manual-overrides/new-request.html
- designs/stitch/manual-overrides/availability-calendar.html
- designs/stitch/manual-overrides/work-surface.html
- docs/decisions/STITCH-FUNCTIONAL-MAPPING.md

[하드 가드레일]
G-1. 원본 Stitch HTML 파일은 수정하지 않는다. 구현은 React route/component 파일에서 한다.
G-2. API, DB schema, migration, RLS 정책 변경 금지. 기존 backend contract를 우선 사용한다.
G-3. PHI 접근 범위 확장 금지. 기존 preview/annotation/feedback/stamp 경로만 유지한다.
G-4. `href="#"`와 inert button을 제품 라우트에 남기지 않는다.
G-5. 가짜 이름, 가짜 요청번호, 가짜 첨부파일, 가짜 슬롯을 실제 데이터가 있는 화면에 노출하지 않는다.
G-6. 새 UI 라이브러리 도입 금지. 기존 Tailwind/Material Symbols/Stitch token 체계 유지.
G-7. 외부 CDN 추가 금지. 현재 self-host/fontsource 경로를 유지한다.
G-8. demo:run과 e2e가 깨지면 안 된다.
G-9. 모호하면 docs/decisions/STITCH-FUNCTIONAL-MAPPING.md에 결정/사유를 추가하고 보수적으로 진행한다.

[범위]
1. `/supervisors`
- `supervisor-catalog.html` 레이아웃을 적용한다.
- 검색/필터 UI는 기존 supervisor search data에 연결한다.
- 카드의 `프로필 보기`는 실제 `/supervisors/{id}`로 이동한다.
- 페이지네이션이 실제 기능이 아니면 제거하지 말고 비활성/현재 페이지 상태로 처리한다.

2. `/supervisors/[id]`
- `supervisor-profile.html` 레이아웃을 적용한다.
- 이름, 자격, 소개, 상품, 가격, 가능 일정은 선택된 supervisor 데이터로 채운다.
- `의뢰 신청하기`는 `/requests/new?supervisorId={id}`로 연결한다.
- `View Slots`는 해당 supervisor availability section을 focus/scroll하거나 상품 선택 상태로 연결한다.

3. `/requests/new`
- `new-request.html` wizard 레이아웃을 적용한다.
- 기존 request 생성 API body/zod validation을 변경하지 않는다.
- supervisorId/productId/slotId가 query 또는 선택 상태로 들어오면 폼에 반영한다.
- 다음 단계 버튼은 실제 wizard state를 전환하고, 최종 제출은 기존 API로 보낸다.

4. `/supervisor/availability`
- `availability-calendar.html` 주간 캘린더 UI를 적용한다.
- 슬롯 토글은 해당 로그인 supervisor의 availability만 저장한다.
- public profile/request booking 화면은 선택된 supervisorId의 slot만 조회한다.
- 구글 캘린더 연동은 OAuth 연결, FreeBusy 충돌 제외, 예약 이벤트 생성,
  취소/거절/전액 환불 시 이벤트 삭제, 화면 내 연동 점검까지 실제 기능으로
  처리한다.

5. `/supervisor/requests/[id]`
- `work-surface.html` 레이아웃을 적용하되 static PHI/file/history를 제거한다.
- 기존 document preview, watermark, annotation 기능을 반드시 포함한다.
- 파일 row 클릭은 앱 내 미리보기 workspace를 연다.
- `보완 요청`, `승인 및 완료`, feedback/stamp/completion controls는 기존 상태 흐름과 API에 연결한다.

6. 전역 fake control audit
- supervisor dashboard/sidebar/catalog/profile/request/work-surface에서 `href="#"`와 inert button을 전수 검색한다.
- 실제 기능으로 연결 가능한 것은 연결한다.
- 아직 구현 범위 밖인 것은 제품 route에서 제거하거나, 실제 상태 설명으로만 남기고 클릭 가능한 fake affordance를 만들지 않는다.

[검증]
- pnpm format:check
- pnpm typecheck
- pnpm lint
- pnpm test
- pnpm drizzle:check
- pnpm build
- pnpm demo:setup
- pnpm demo:run
- pnpm e2e

[성공 기준]
SC-1. 위 검증 명령 통과.
SC-2. 핵심 라우트에 `href="#"`가 남지 않는다.
SC-3. 실제 데이터가 있는 화면에 fake request/file/person/calendar data가 노출되지 않는다.
SC-4. `/supervisors`, `/supervisors/[id]`, `/requests/new`, `/supervisor/availability`, `/supervisor/requests/[id]`가 manual override HTML과 시각적으로 같은 구조를 유지한다.
SC-5. Supervisor A의 availability가 Supervisor A public profile/request booking에만 표시된다.
SC-6. Work surface에서 앱 내부 preview와 annotation 기능이 유지된다.
SC-7. API/schema/RLS/migration 변경 없음.

[보고 형식]
작업 끝나면:
1. 변경 파일 목록.
2. 라우트별 적용 요약.
3. fake control 제거/연결 목록.
4. availability 동기화 방식.
5. preview/annotation 유지 확인.
6. 검증 결과.
7. 다음 후보 1개 추천.
```
