# ClinicFlow Read-Only Structure Audit

작성일: 2026-06-15

범위: ClinicFlow 대규모 UI/UX 및 정보구조 리팩터링 전 읽기 전용 구조 감사.

제약:

- 앱 코드 수정 없음
- 리팩터링 없음
- 커밋 없음
- 패키지 설치 없음
- UI 개선 구현 없음

## 1. 기술 스택 요약

| 항목 | 내용 |
|---|---|
| framework | Next.js App Router, React |
| routing system | `apps/web/src/app`, `apps/admin/src/app` 기반 App Router |
| styling system | Tailwind CSS v4, `@csp/design-tokens/css`, Pretendard/Noto Sans KR 계열 |
| auth/session mechanism | 자체 세션 쿠키 + JWT 계열 helper: `SESSION_COOKIE_NAME`, `verifySession`, `signSession` |
| database/client layer | Drizzle ORM, Neon/Postgres, PGlite dev DB, `@csp/db` 패키지 |
| state management | 전역 상태 라이브러리 없음. 서버 컴포넌트 + client form state + API mutation 중심 |
| test/build/lint | Vitest, Playwright, TypeScript, ESLint, Drizzle check |

주요 config:

- `apps/web/next.config.ts`
- `apps/admin/next.config.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `packages/db/drizzle.config.ts`

## 2. 최상위 폴더 구조

```text
ClinicalSupervisionPlatform
├─ apps
│  ├─ web
│  │  ├─ src/app
│  │  │  ├─ (auth)
│  │  │  ├─ (public)
│  │  │  ├─ (supervisee)
│  │  │  ├─ (supervisor)
│  │  │  ├─ api
│  │  │  ├─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  └─ globals.css
│  │  ├─ src/components
│  │  └─ src/lib
│  └─ admin
│     ├─ src/app
│     │  ├─ admin
│     │  ├─ api
│     │  ├─ auth
│     │  ├─ page.tsx
│     │  └─ globals.css
│     ├─ src/components
│     └─ src/lib/auth
├─ packages
│  ├─ db/src
│  ├─ shared/src
│  └─ design-tokens
├─ scripts
├─ docs
└─ demo-evidence
```

## 3. 전체 라우트 인벤토리

UI page/error route는 46개, API route는 70개다.

| path | source file path | access level | likely template type | current page purpose / primary CTA / obvious issue |
|---|---|---:|---|---|
| `/` | `apps/web/src/app/page.tsx` | public | PublicLanding | 홈. CTA `/supervisors`, `/guide`, `/requests/new` |
| `/login` | `apps/web/src/app/(auth)/login/page.tsx` | public/auth | SettingsForm | 로그인 |
| `/signup` | `apps/web/src/app/(auth)/signup/page.tsx` | public/auth | SettingsForm | 계정 생성 |
| `/forgot-password` | `apps/web/src/app/(auth)/forgot-password/page.tsx` | public/auth | SettingsForm | 비밀번호 재설정 요청 |
| `/reset-password` | `apps/web/src/app/(auth)/reset-password/page.tsx` | public/auth | SettingsForm | 새 비밀번호 설정 |
| `/email/verify` | `apps/web/src/app/(auth)/email/verify/page.tsx` | public/auth | SettingsForm | 이메일 확인 |
| `/verify-email` | `apps/web/src/app/(auth)/verify-email/page.tsx` | public/auth | Unknown | 구현 흔적 약함. 확인 필요 |
| `/supervisors` | `apps/web/src/app/(public)/supervisors/page.tsx` | public | DirectoryList | 슈퍼바이저 탐색 |
| `/supervisors/[id]` | `apps/web/src/app/(public)/supervisors/[id]/page.tsx` | public | DetailPage | 슈퍼바이저 상세 |
| `/guide` | `apps/web/src/app/(public)/guide/page.tsx` | public | DetailPage | 이용 가이드 |
| `/resources` | `apps/web/src/app/(public)/resources/page.tsx` | public | DetailPage | 자료/가이드 |
| `/clinical-guidelines` | `apps/web/src/app/(public)/clinical-guidelines/page.tsx` | public | DetailPage | 임상 가이드라인 |
| `/terms` | `apps/web/src/app/(public)/terms/page.tsx` | public | DetailPage | 약관 |
| `/privacy` | `apps/web/src/app/(public)/privacy/page.tsx` | public | DetailPage | 개인정보 |
| `/security` | `apps/web/src/app/(public)/security/page.tsx` | public | DetailPage | 보안 안내 |
| `/sensitive-consent` | `apps/web/src/app/(public)/sensitive-consent/page.tsx` | public | Unknown | 민감정보 동의. 템플릿 정렬 필요 |
| `/requests` | `apps/web/src/app/(supervisee)/requests/page.tsx` | supervisee | QueueList | 내 의뢰 목록 |
| `/requests/new` | `apps/web/src/app/(supervisee)/requests/new/page.tsx` | supervisee | TransactionWizard | 새 의뢰 초안/세션·일정 |
| `/requests/[id]` | `apps/web/src/app/(supervisee)/requests/[id]/page.tsx` | supervisee | DetailPage | 의뢰 상세/자료/피드백 |
| `/payments` | `apps/web/src/app/(supervisee)/payments/page.tsx` | supervisee | AdminTable | 결제 내역. 이름상 list/table 적합 |
| `/payments/[id]` | `apps/web/src/app/(supervisee)/payments/[id]/page.tsx` | supervisee | DetailPage | 결제 상세 |
| `/payments/confirm` | `apps/web/src/app/(supervisee)/payments/confirm/page.tsx` | supervisee | TransactionWizard | 결제 확인 |
| `/case-archive` | `apps/web/src/app/(supervisee)/case-archive/page.tsx` | supervisee | RecordArchive | 학습 기록 |
| `/notifications` | `apps/web/src/app/(supervisee)/notifications/page.tsx` | supervisee | QueueList | 알림. 템플릿 명확화 필요 |
| `/settings` | `apps/web/src/app/(supervisee)/settings/page.tsx` | supervisee | SettingsForm | 계정 설정 |
| `/supervisor` | `apps/web/src/app/(supervisor)/supervisor/page.tsx` | supervisor | RoleDashboard | 슈퍼바이저 업무 홈 |
| `/supervisor/requests` | `apps/web/src/app/(supervisor)/supervisor/requests/page.tsx` | supervisor | QueueList | 검토할 의뢰 |
| `/supervisor/requests/[id]` | `apps/web/src/app/(supervisor)/supervisor/requests/[id]/page.tsx` | supervisor | DetailPage | 사례 검토 workspace |
| `/supervisor/profile` | `apps/web/src/app/(supervisor)/supervisor/profile/page.tsx` | supervisor | SettingsForm | 공개 프로필 |
| `/supervisor/products` | `apps/web/src/app/(supervisor)/supervisor/products/page.tsx` | supervisor | SettingsForm | 슈퍼비전 방식/상품 |
| `/supervisor/availability` | `apps/web/src/app/(supervisor)/supervisor/availability/page.tsx` | supervisor | SettingsForm | 가능 일정 |
| `/supervisor/memory` | `apps/web/src/app/(supervisor)/supervisor/memory/page.tsx` | supervisor | RecordArchive | 기록/맥락 |
| `/supervisor/payouts` | `apps/web/src/app/(supervisor)/supervisor/payouts/page.tsx` | supervisor | AdminTable | 정산 내역 |
| `/supervisor/qualifications` | `apps/web/src/app/(supervisor)/supervisor/qualifications/page.tsx` | supervisor | SettingsForm | 자격 제출/상태 |
| `/me` | `apps/web/src/app/(supervisor)/me/page.tsx` | supervisor | Unknown | 라우트 목적 불명확. 중복 가능 |
| `/admin` | `apps/admin/src/app/admin/page.tsx` | admin | AdminTable | 운영 콘솔 |
| `/admin/queue` | `apps/admin/src/app/admin/queue/page.tsx` | admin | AdminTable | 운영 대기열 |
| `/admin/qualifications` | `apps/admin/src/app/admin/qualifications/page.tsx` | admin | AdminTable | 자격 심사 |
| `/admin/refunds` | `apps/admin/src/app/admin/refunds/page.tsx` | admin | AdminTable | 환불 검토 |
| `/admin/payouts` | `apps/admin/src/app/admin/payouts/page.tsx` | admin | AdminTable | 정산 확인 |
| `/admin/audit` | `apps/admin/src/app/admin/audit/page.tsx` | admin | AdminTable | 처리 기록 |
| `/payouts` | `apps/admin/src/app/(admin)/payouts/page.tsx` | admin | AdminTable | legacy/중복 후보 |
| `/refunds` | `apps/admin/src/app/(admin)/refunds/page.tsx` | admin | AdminTable | legacy/중복 후보 |
| `apps/web error` | `apps/web/src/app/error.tsx` | public | ErrorPage | 웹 error boundary |
| `apps/admin /` | `apps/admin/src/app/page.tsx` | admin | AdminTable | admin root |
| `apps/admin error` | `apps/admin/src/app/error.tsx` | admin | ErrorPage | admin error boundary |

API route family:

| group | count |
|---|---:|
| admin | 10 |
| auth | 9 |
| case-files | 8 |
| me/profile/products/availability | 16 |
| ops | 2 |
| payments | 6 |
| supervision-requests | 16 |
| other | 3 |

## 4. 역할별 내비게이션 현재 상태

| 항목 | current path |
|---|---|
| public header | `apps/web/src/components/clinicflow-shell.tsx` |
| authenticated shell | `apps/web/src/components/app-shell.tsx` |
| role nav config | `apps/web/src/components/app-navigation.tsx` |
| account/logout menu | `apps/web/src/components/account-menu.tsx` |
| admin shell | `apps/admin/src/components/admin-shell.tsx` |
| admin account menu | `apps/admin/src/components/admin-account-menu.tsx` |

현재 상태:

- web 역할 내비게이션은 `navigationForRole(role)`로 중앙화되어 있다.
- supervisee/supervisor/admin 메뉴 배열은 `app-navigation.tsx` 한 파일에 있다.
- active route는 `active` prop과 `aria-current="page"`로 표현된다.
- 로그인 후 persistent sidebar는 없고, 계정 메뉴/모바일 role navigation 중심이다.
- admin app은 별도 `AdminAccountMenu`에 `/admin`, `/admin/queue`, `/admin/qualifications`, `/admin/refunds`, `/admin/payouts`, `/admin/audit`가 있다.
- public header와 authenticated navigation이 분리되어 있어 방향은 좋다.
- web 쪽 `adminNavigation`은 `/admin`, `/settings` 정도라 admin app 메뉴와 분리되어 있다. admin은 사실상 별도 앱으로 보는 구조다.

## 5. 인증과 권한 보호 구조

| 영역 | 구현 위치 | 판단 |
|---|---|---|
| web 세션 읽기 | `apps/web/src/lib/auth/current-user.ts` | 세션 cookie 검증 후 DB/demo user 확인 |
| web guard helper | `apps/web/src/lib/auth/guards.ts` | `isSupervisor`, `isSupervisee`, `isAdminWithTotp` |
| web `/admin` middleware | `apps/web/src/middleware.ts` | `/admin/:path*` 접근 시 admin이면 admin app으로 redirect, 비admin은 403 |
| admin middleware | `apps/admin/src/middleware.ts` | 네트워크 접근 정책만 검사 |
| admin 세션 읽기 | `apps/admin/src/lib/auth/current-admin.ts` | admin + active + totp 필요 |
| locked state UI | `apps/web/src/components/locked-state.tsx`, `apps/admin/src/components/admin-shell.tsx` | login required / role required 화면 제공 |

관찰:

- supervisee/supervisor route는 middleware 일괄 보호보다 page-level `LoginRequiredState`, `RoleRequiredState`가 주력이다.
- admin route는 admin app에서 `getCurrentAdmin` + locked state, admin middleware는 network gate다.
- 권한 없는 사용자를 엉뚱한 설정 화면으로 보내는 문제는 현재 구조상 상당히 줄었지만, page-level guard가 누락된 route는 수동 확인 필요하다.
- `/me`, `/verify-email`, `/sensitive-consent`, admin legacy `/payouts`, `/refunds`는 보호/목적 확인 대상이다.

## 6. 핵심 DB/상태 모델

상태 정의:

- `packages/db/src/schema.ts`
- `packages/shared/src/supervision/status-machine.ts`

`supervision_status`:

```text
draft
submitted
awaiting_payment
paid
awaiting_supervisor_review
accepted
rejected
additional_info_requested
in_review
feedback_submitted
meeting_scheduled
meeting_completed
completion_record_issued
completed
cancelled
refunded
expired
deleted
```

UI label/step mapping:

- `apps/web/src/app/(supervisee)/requests/[id]/request-detail-view-model.ts`
- `requestFlowSteps`: 슈퍼바이저 선택 → 세션·일정 → 사례자료 정리 → 확인·결제 → 학습 기록
- `statusLabel(status)`가 사용자-facing Korean label 제공
- `flowStepForStatus(status)`는 일부 상태를 UI 단계로 압축함

상태 전환:

- `ALLOWED_TRANSITIONS`가 `packages/shared/src/supervision/status-machine.ts`에 중앙화되어 있다.
- payment는 `packages/db/src/payments.ts`, API는 `apps/web/src/app/api/payments/*`.
- supervisor accept/reject/approval은 `apps/web/src/app/api/supervision-requests/[id]/accept`, `approval` 계열.

위험:

- DB 상태는 18개인데 UI step은 5개라 압축 매핑이 필수다.
- label mapping은 존재하지만 route별로 중복 label/상태 문구가 있을 가능성이 있다.
- `meeting_scheduled`, `meeting_completed`가 사용자 flow에서 어떻게 보이는지 별도 확인 필요하다.

## 7. UI 컴포넌트 구조

| 그룹 | 주요 파일 | 상태 |
|---|---|---|
| layout/shell | `app-shell.tsx`, `clinicflow-shell.tsx`, `admin-shell.tsx` | 재사용 가능. public/authenticated/admin 분리됨 |
| navigation | `app-navigation.tsx`, `account-menu.tsx`, `admin-account-menu.tsx` | 중앙화 진행됨. admin/web 메뉴는 분리 |
| cards | `components/ui/card.tsx`, `AdminCard` | admin에 Card 사용량 많음. 일부는 row/table 전환 후보 |
| tables/lists | `divide-y`, queue row pattern 산재 | 전용 `LineList` 같은 공통 컴포넌트는 부족 |
| forms | auth forms, request form, profile/product/availability forms | 기능별 분리됨. 공통 form shell은 제한적 |
| stepper/progress | `FlowStepNav` in `clinicflow-shell.tsx` | supervisee flow에 재사용 가능 |
| empty/loading/error | `components/ui/state.tsx`, `locked-state.tsx`, admin locked state | 존재함. wording 통일 필요 |
| buttons/badges/tags | `components/ui/button.tsx`, badge류 page-local 다수 | 일부 중복 가능 |
| modals/dialogs | 뚜렷한 전역 modal layer는 보이지 않음 | 필요 시 별도 설계 |
| supervisor-specific | `request-workflow.tsx`, profile/products/availability forms | 분리됨 |
| admin-specific | `AdminShell`, `AdminCard`, action/download/payout form | admin app 내부에 있음 |

## 8. 페이지 템플릿 관점의 문제

| template type | routes that should use it | current implementation quality | missing shared components | recommended shared component names |
|---|---|---|---|---|
| PublicLanding | `/` | Origin-14 방향. 섹션 확장 여지 | public flow section | `PublicFlowBand` |
| DirectoryList | `/supervisors` | card/grid 흔적 강함 | 비교형 row/list | `SupervisorListRow` |
| DetailPage | `/supervisors/[id]`, `/guide`, legal pages | 대체로 분리 | 상세 summary panel | `DetailSummaryPanel` |
| TransactionWizard | `/requests/new`, `/payments/confirm` | stepper 있음 | 저장/다음/제출 의미 표준화 | `WizardActionBar` |
| QueueList | `/requests`, `/supervisor/requests`, `/admin/queue` | 점점 row-first | 공통 queue row | `WorkQueueRow` |
| RecordArchive | `/case-archive`, `/supervisor/memory` | 좋은 후보 | folder/tree 공통화 | `RecordTree` |
| SettingsForm | settings/profile/products/availability | 분산 | form section shell | `SettingsSection` |
| AdminTable | admin pages, payouts/refunds | admin card 남아 있음 | dense table/list shell | `AdminListTable` |
| ErrorPage | app error/locked states | 존재 | copy consistency | `RoleErrorState` |

## 9. 카드 UI 사용 현황

카드/그리드 후보:

- `apps/web/src/app/page.tsx`: `grid-cols`, 큰 rounded/shadow 다수
- `apps/web/src/app/(public)/supervisors/page.tsx`: directory인데 card/grid 사용량 높음
- `apps/web/src/app/(supervisee)/requests/[id]/request-detail-client.tsx`: 큰 rounded section 많음
- `apps/admin/src/app/admin/audit/page.tsx`: `AdminCard` 9회
- `apps/admin/src/app/admin/payouts/page.tsx`: `AdminCard` 7회
- `apps/admin/src/app/admin/refunds/page.tsx`: `AdminCard` 7회
- `apps/web/src/app/(supervisor)/supervisor/payouts/page.tsx`: `Card` 8회
- supervisor form components: profile/products/availability/qualifications에 Card 3-5회

나중에 list/table/task-list로 바꾸기 좋은 곳:

- `/supervisors`: 비교형 list
- `/requests`: active request row list 유지
- `/supervisor/requests`: queue-first list
- `/admin/queue`, `/admin/qualifications`, `/admin/refunds`, `/admin/payouts`, `/admin/audit`: table/list-first
- `/supervisor/payouts`: card보다 정산 row/table

## 10. 깨진 화면/위험 화면 후보

| route | source path | suspected cause | what to verify manually |
|---|---|---|---|
| `/verify-email` | `apps/web/src/app/(auth)/verify-email/page.tsx` | visible hints/components 없음 | 실제 접근 시 의미 있는 화면인지 |
| `/sensitive-consent` | `apps/web/src/app/(public)/sensitive-consent/page.tsx` | template unknown | public/legal 문서 스타일 여부 |
| `/me` | `apps/web/src/app/(supervisor)/me/page.tsx` | 목적 불명확, `/settings`/`/supervisor/profile`와 중복 가능 | 로그인 후 노출 여부 |
| `/payouts` admin app | `apps/admin/src/app/(admin)/payouts/page.tsx` | `/admin/payouts`와 중복/legacy 가능 | 직접 URL 처리 |
| `/refunds` admin app | `apps/admin/src/app/(admin)/refunds/page.tsx` | `/admin/refunds`와 중복/legacy 가능 | 직접 URL 처리 |
| `/supervisor/profile` | `apps/web/src/app/(supervisor)/supervisor/profile/page.tsx` | 로딩/DB fallback error state 있음 | demo supervisor 로그인 후 정상 form |
| `/supervisor/products` | `apps/web/src/app/(supervisor)/supervisor/products/page.tsx` | loading/error fallback 명시 | 상품 CRUD 시나리오 |
| `/supervisor/availability` | `apps/web/src/app/(supervisor)/supervisor/availability/page.tsx` | 일정 fetch/error fallback 명시 | 가능 시간 저장 |
| `/requests/[id]` | `apps/web/src/app/(supervisee)/requests/[id]/page.tsx` | DB missing fallback, PHI detail fallback | demo/real DB 양쪽 detail |
| `/admin/*` | admin app pages | admin network + admin session 이중 조건 | 비admin, admin no-TOTP, admin demo |

## 11. 대표 사용자 플로우 추적

### Public → request start

| step | route exists | UI navigation | disconnected point |
|---|---:|---|---|
| `/` | yes | `/supervisors`, `/guide`, `/requests/new` CTA | 로그인 전 `/requests/new` 처리 확인 필요 |
| `/supervisors` | yes | public header/CTA | card-heavy 위험 |
| `/supervisors/[id]` | yes | 상세 진입 가능 | CTA가 request draft로 잘 이어지는지 확인 |
| `/requests/new` | yes | supervisee guard 필요 | 로그인 redirect + returnTo 확인 필요 |

### Supervisee dashboard

| step | route exists | UI navigation | disconnected point |
|---|---:|---|---|
| `/requests` | yes | role nav “내 의뢰” | fallback data/real DB 차이 |
| `/requests/[id]` | yes | request row/detail | 자료 업로드 anchor 연결 확인 |
| `/payments` | yes | role nav | list/table template 정리 필요 |
| `/case-archive` | yes | role nav | folder/tree 방향 적합 |

### Supervisor work

| step | route exists | UI navigation | disconnected point |
|---|---:|---|---|
| `/supervisor` | yes | role nav “업무 홈” | dashboard filler 제거 확인 |
| `/supervisor/requests` | yes | role nav | queue-first 유지 필요 |
| `/supervisor/requests/[id]` | yes | queue row에서 진입 | workspace 내 CTA 과잉 확인 |
| `/supervisor/memory` | yes | role nav | raw memory 느낌 방지 필요 |

### Supervisor setup

| step | route exists | UI navigation | disconnected point |
|---|---:|---|---|
| `/supervisor/profile` | yes | role nav | profile preview/edit 분리 확인 |
| `/supervisor/products` | yes | role nav | “상품”보다 “슈퍼비전 방식” wording 유지 |
| `/supervisor/availability` | yes | role nav | 저장 feedback 확인 |
| `/supervisor/payouts` | yes | role nav | card-heavy 위험 |

### Admin

| step | route exists | UI navigation | disconnected point |
|---|---:|---|---|
| `/admin` | yes | admin account menu | web app `/admin`은 admin app redirect |
| `/admin/queue` | yes | admin menu | list-first 유지 |
| `/admin/qualifications` | yes | admin menu | action panel 과밀 확인 |
| `/admin/refunds` | yes | admin menu | card/list 균형 확인 |
| `/admin/payouts` | yes | admin menu | duplicate `/payouts` 확인 |
| `/admin/audit` | yes | admin menu | audit table density 확인 |

## 12. 실행 및 검증 명령

| 목적 | command |
|---|---|
| install | `pnpm install` |
| web dev server | `pnpm dev:web` 또는 `pnpm --filter @csp/web dev` |
| admin dev server | `pnpm dev:admin` 또는 `pnpm --filter @csp/admin dev` |
| all build | `pnpm build` |
| web build | `pnpm --filter @csp/web build` |
| admin build | `pnpm --filter @csp/admin build` |
| all typecheck | `pnpm typecheck` |
| web typecheck | `pnpm --filter @csp/web typecheck` |
| admin typecheck | `pnpm --filter @csp/admin typecheck` |
| lint | `pnpm lint` |
| test | `pnpm test` |
| e2e | `pnpm e2e` |
| DB schema check | `pnpm drizzle:check` |
| Origin-14 guard | `pnpm origin14:check` |
| release fast check | `pnpm release:web:fast-check` |
| web UI preview | `pnpm release:web:ui-preview` |
| admin release check | `pnpm release:admin:check` |

## 13. 최종 요약

- 현재 앱은 `apps/web`과 `apps/admin`의 이중 Next 앱 구조다.
- UI page/error route는 46개, API route는 70개다.
- 역할별 navigation은 이미 `app-navigation.tsx`로 상당 부분 중앙화되어 있고, logout/account menu도 존재한다.
- public header와 authenticated role navigation은 분리되어 있어 방향은 맞다.
- 권한 보호는 web `/admin` middleware, admin network middleware, page-level role guard가 혼합된 구조다. supervisee/supervisor는 page-level guard 누락 여부를 route별로 확인해야 한다.
- request 상태 enum과 transition machine은 비교적 잘 중앙화되어 있지만, user-facing step/label은 일부 route-local mapping이 남아 있을 수 있다.
- 가장 큰 UI 구조 리스크는 `/supervisors`, admin pages, supervisor payouts/profile/products 계열의 card/grid 사용량이다.
- 다음 리팩터링 프롬프트는 `AppShell`, `AppNavigation`, `FlowStepNav`, `SectionBlock`, `PrimaryActionPanel`, `AdminShell`을 기준으로 공통 템플릿을 먼저 확정한 뒤 route별 UI를 맞추는 방식이 안전하다.
- 이번 감사는 read-only 구조 감사이며, 앱 코드 수정/커밋/패키지 설치/테스트 실행은 수행하지 않았다.
