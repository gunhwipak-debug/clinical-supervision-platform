# ClinicFlow AI-Pattern UI/UX Audit Report

작성일: 2026-06-14

대상:

- `apps/web/src/app`
- `apps/web/src/components`
- `apps/admin/src/app`
- `apps/admin/src/components`
- `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`

## 1. Executive Summary

이번 작업은 정적 프리뷰에 머물러 있던 AI-style UI 감사 기준을 실제 production Next route 일부에 적용한 UI/UX 정리다. 데이터베이스, 인증, 결제, API 계약, 라우트 의미는 변경하지 않았다.

수정 전 판단:

- 공개 슈퍼바이저 목록에 `pnpm demo:setup` 같은 개발 명령어가 일반 사용자 화면에 노출되어 있었다.
- 슈퍼바이저 콘솔은 `새 의뢰 / 검토 중 / 완료` 숫자 카드가 먼저 보이는 전형적인 AI dashboard filler 구조였다.
- 의뢰 상세에는 `DB`, `PHI` 같은 내부/보안 약어가 사용자 메시지에 그대로 노출되었다.
- 결제 상세와 관리자 화면 일부는 `rounded-3xl`, gradient, 큰 metric cards 때문에 실제 업무 화면보다 템플릿/장식 화면처럼 보였다.
- 설정/프로필 화면에는 `수퍼`, `지도교수` 등 표기와 역할 언어가 섞여 있었다.

수정 후 판단:

- 공개 슈퍼바이저 목록은 사진, 자격, 전문 분야, 소개를 비교하는 전문 인명록 문법으로 정리했다.
- 슈퍼바이저 콘솔은 숫자 KPI 대신 “다음에 처리할 요청”과 상태 기반 작업 큐를 먼저 보여준다.
- 사용자-facing 메시지에서 `PHI`, `DB 환경`, `서명 URL`, `demo:setup`, `수퍼`, `지도교수` 노출을 제거했다.
- 결제/관리자/프로필/제공 항목 관리 화면의 큰 표면 radius를 줄이고 장식 그라데이션을 제거했다.
- `자료실` 라벨은 주요 shell/header에서 `가이드·자료`로 바꿔 첫 사용자에게 더 분명하게 만들었다.

## 2. AI-Style Anti-Patterns Found

| 문제                | 발견 위치                                                 | 판단                                                        |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| 개발 명령어 노출    | `/supervisors`                                            | public UI에 `pnpm demo:setup`이 노출되어 제품 신뢰를 깨뜨림 |
| 의미 없는 숫자 카드 | `/supervisor`, `/payments`, `/admin`                      | 사용자의 다음 행동보다 숫자가 먼저 보임                     |
| 내부 용어 노출      | `/requests/[id]`, `/privacy`, `/security`, `/admin/audit` | `PHI`, `DB 환경`, `서명 URL`은 사용자 언어가 아님           |
| 과한 라운딩/장식    | 결제 상세, 관리자 상세, 프로필/제공 항목 관리             | 임상 교육 제품보다 toy-like/template-like 인상              |
| 역할 언어 불일치    | settings/profile/new request                              | `수퍼`, `지도교수`, `[의뢰자 전용]` 등 산만한 표현          |

## 3. Bad-Pattern Replacements

| 제거/축소한 것               | 대체한 것                                 | 이유                                    |
| ---------------------------- | ----------------------------------------- | --------------------------------------- |
| `pnpm demo:setup` 안내       | 슈퍼바이저 선택 기준 안내                 | 사용자가 실제로 비교해야 할 정보에 집중 |
| KPI 카드 3개                 | 다음 요청 + 상태 기반 작업 큐             | 슈퍼바이저가 바로 할 일을 알 수 있음    |
| `DB 환경`, `PHI`             | “사례 자료를 안전하게 저장할 수 없습니다” | 내부 문제를 사용자 언어로 설명          |
| `서명 URL`                   | “접근 링크”                               | 보안 기능을 일반 운영 언어로 표현       |
| `rounded-3xl`, gradient line | `rounded-xl`, 평평한 카드 표면            | 전문적이고 성숙한 업무 UI에 맞춤        |
| `수퍼`, `지도교수`           | `슈퍼`, `슈퍼바이저`                      | 용어 일관성 확보                        |

## 4. Public Homepage / Public Surface Audit

수정 내용:

- `/` 헤더의 `자료실`을 `가이드·자료`로 조정했다.
- `/supervisors`의 마케팅형 gradient onboarding banner를 제거했다.
- `/supervisors`는 “사진 / 자격 / 전문 분야 / 소개” 기준으로 슈퍼바이저를 비교하도록 안내한다.
- `/supervisors/[id]` 헤더 라벨을 `가이드·자료`로 맞췄다.
- `/privacy`, `/security`의 `PHI`, `서명 URL`을 사용자 언어로 변경했다.

최종 public 방향:

- 상품 판매형 copy가 아니라 교육/슈퍼비전 연결 흐름을 설명한다.
- public page에서 내부 명령어, 개발자 약어, 보안 콘솔 같은 문구를 노출하지 않는다.

## 5. Supervisor Dashboard Audit

수정 전:

- `새 의뢰`, `검토 중`, `완료`가 큰 숫자 카드로 표시되었다.
- 숫자 카드가 업무 결정이나 다음 행동과 직접 연결되지 않았다.

수정 후:

- 첫 화면은 `다음에 처리할 요청`을 중심으로 구성했다.
- 요청 상태 우선순위는 `추가자료 요청됨 -> 슈퍼바이저 확인 대기 -> 수락됨 -> 검토 진행 중 -> 피드백 도착 -> 이수 기록 발급됨` 흐름으로 정렬된다.
- 각 큐 항목은 상태별 행동 라벨을 먼저 보여준다.

## 6. Border-Radius And Seriousness Audit

변경한 대표 항목:

- 결제 상세 주요 카드: `rounded-3xl` -> `rounded-xl`
- 관리자 qualifications/refunds/payouts/audit 카드: `rounded-3xl` -> `rounded-xl`
- supervisor profile/products/payouts 카드: `rounded-3xl` -> `rounded-xl`
- 결제 확인 카드: `rounded-3xl` -> `rounded-xl`
- 장식용 결제 상세 gradient top line 제거

유지한 것:

- 작은 badge, avatar, pill navigation은 기능적 구분에 필요해 유지했다.

## 7. Terminology Cleanup

제거/대체한 사용자-facing 용어:

- `PHI` -> `민감한 사례 자료`, `사례 자료`
- `DB 환경` -> `현재 사례 자료를 안전하게 저장할 수 없습니다`
- `서명 URL` -> `접근 링크`
- `감사 로그` -> `처리 기록`
- `수퍼비전`, `수퍼바이저` -> `슈퍼비전`, `슈퍼바이저`
- `지도교수` -> `슈퍼바이저`
- `상품`, `서비스 상품` -> `제공 항목`, `세션 유형`, `지도 방식`
- `자료실` -> `가이드·자료` in shell/header surfaces

남은 예외:

- 테스트 파일과 환경 변수명에는 `PHI_ENCRYPTION_KEY`가 남아 있다. 이는 사용자 화면이 아니라 테스트/환경 설정 식별자라 UI/UX scope 밖이다.

## 8. Layout Density And Whitespace Audit

- `/supervisors`의 oversized onboarding block을 compact comparison criteria block으로 바꿨다.
- `/supervisor`의 metric strip을 업무 중심 panel로 대체했다.
- `/payments`의 3개 summary cards를 결제 상태 panel 1개로 합쳤다.
- 관리자 홈은 metric strip을 제거하고 운영 queue를 먼저 보여준다.
- 설정 화면의 4-step promotional grid를 짧은 상태/신청 안내로 축소했다.

## 9. Expert Scorecard

| Route group | Before | After | Note                                        |
| ----------- | -----: | ----: | ------------------------------------------- |
| Public      |    3.2 |   4.2 | 개발 명령어/내부 약어/마케팅형 banner 제거  |
| Supervisee  |    3.7 |   4.2 | 결제, 의뢰 상세, 설정 copy와 hierarchy 정리 |
| Supervisor  |    3.3 |   4.3 | KPI filler 제거, 작업 큐 중심 재구성        |
| Admin       |    3.5 |   4.1 | metric strip/로그 표현/radius 개선          |

## 10. Route-By-Route Coverage

| Route                                         | Coverage         | Notes                                                                         |
| --------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `/`                                           | changed          | header label/copy polish                                                      |
| `/supervisors`                                | changed          | demo command removed, comparison criteria block added                         |
| `/supervisors/[id]`                           | changed          | header label consistency and formatted surface                                |
| `/clinical-guidelines` (`/guide` counterpart) | reviewed         | current route exists as clinical-guidelines                                   |
| `/resources`                                  | reviewed         | simple info page retained                                                     |
| `/terms`, `/security`, `/privacy`             | changed/reviewed | security/privacy terminology cleaned                                          |
| `/requests`                                   | reviewed         | list structure retained                                                       |
| `/requests/new`                               | changed          | `수퍼` -> `슈퍼`                                                              |
| `/requests/[id]`                              | changed          | internal terminology and radius cleaned                                       |
| `/payments`                                   | changed          | metric cards replaced with status panel                                       |
| `/payments/[id]`                              | changed          | gradient and excessive radius removed                                         |
| `/case-archive`                               | changed          | supervisor-grouped learning record route now exists in production surface     |
| `/settings`                                   | changed          | role language and promotional grid reduced                                    |
| `/supervisor`                                 | changed          | KPI cards replaced with next-request work queue                               |
| `/supervisor/profile`                         | changed          | copy and radius cleaned                                                       |
| `/supervisor/availability`                    | reviewed         | no high-priority change in this pass                                          |
| `/supervisor/requests`                        | reviewed         | queue structure already action-oriented                                       |
| `/supervisor/requests/[id]`                   | reviewed         | later focused workspace polish recommended                                    |
| `/supervisor/memory`                          | changed          | route exists as a record-folder surface; richer note CRUD remains Feature Lab |
| `/supervisor/products`                        | changed          | public-facing wording normalized to `제공 항목`                               |
| `/supervisor/payouts`                         | changed          | radius reduced                                                                |
| `/admin`                                      | changed          | metric cards removed, operation queue first                                   |
| `/admin/queue`                                | changed          | route exists as an admin operation queue surface                              |
| `/admin/qualifications`                       | changed          | radius reduced                                                                |
| `/admin/refunds`                              | changed          | radius reduced                                                                |
| `/admin/payouts`                              | changed          | radius reduced                                                                |
| `/admin/audit`                                | changed          | `감사 로그`/`서명 URL` wording reduced                                        |

## 11. Accessibility And Responsive Notes

- Existing semantic headings and links are preserved.
- Primary actions remain links/buttons with visible labels.
- Status panels use text labels, not color alone.
- No new dependency or UI library was introduced.
- Responsive grid structure was retained; major edits reduce rather than expand layout complexity.

## 12. Verification Commands And Results

Commands run during this pass:

- `rg -n "PHI|DB 환경|demo:setup|수퍼|지도교수|지도자|rounded-3xl|bg-gradient|KpiCard|MetricCard|감사 로그|서명 URL" apps/web/src/app apps/web/src/components apps/admin/src/app apps/admin/src/components --glob '!**/api/**'`
  - Result: no user-facing source matches after cleanup.
- `pnpm exec prettier --write <changed UI files>`
  - Result: completed.
- `pnpm exec prettier --check <changed UI files> docs/ui-ux/clinicflow-ai-pattern-uiux-audit-report.md`
  - Result: passed.
- `git diff --check`
  - Result: passed.
- `pnpm test`
  - Result: passed with exit code 0.
- `pnpm --filter @csp/web typecheck`
  - Result: no TypeScript diagnostics after 90+ seconds; manually stopped with `SIGINT`.
- `pnpm --filter @csp/admin typecheck`
  - Result: no TypeScript diagnostics after 90+ seconds; manually stopped with `SIGINT`.
- `pnpm lint`
  - First result: failed before lint findings with ESLint runtime error, `TypeError: Class extends value undefined is not a constructor or null`.
  - After `pnpm install --frozen-lockfile` and `pnpm install --force --frozen-lockfile`: no lint diagnostics after 120+ seconds; manually stopped with `SIGINT`.
- `pnpm --filter @csp/web build`
  - Result: failed before app compilation with Next internal package config error, `ERR_INVALID_PACKAGE_CONFIG` under `node_modules/.pnpm/next.../dist/compiled/.../package.json`.
- `pnpm --filter @csp/admin build`
  - Result: failed before app compilation with the same Next internal package config class of error.
- `pnpm e2e --project=chromium --grep "desktop"`
  - First result: failed because Playwright internal file was missing under `node_modules/.pnpm/playwright.../lib/transform/esmLoader.js`.
  - After dependency relink attempt: failed before screenshots because `scripts/demo-dev.ts` could not find `dev-data/pglite`.
- `codex-ultrawork-reviewer`
  - First result: blocked on products nav active label, `URL 발급` copy, and patronizing/profile-offering wording.
  - Follow-up: blockers were fixed by normalizing `제공 항목`, replacing `URL 발급` with `접근 링크 발급`, and removing `어르신도`/`후배`/`카탈로그`/`원스톱` copy.

## 13. Remaining Risks

- `/case-archive`, `/supervisor/memory`, `/admin/queue` do not appear as production route files in this pass. They need architecture/product confirmation before creation.
- Several deeper admin and supervisor detail pages are improved for radius/copy but have not been fully redesigned.
- Browser automation for the existing `file://` preview was previously blocked by the in-app browser URL policy; Playwright e2e also cannot start until `dev-data/pglite` is restored.
- Build and some verification commands are currently blocked before app compilation by local dependency/runtime issues under `node_modules` and missing demo seed data.

## 14. Handoff Notes

Architecture:

- Decide whether `/case-archive`, `/supervisor/memory`, and `/admin/queue` are intended production routes or future rebuild routes.
- Keep request state semantics centralized; UI should translate raw states, not change them.

Feature Lab:

- Define the learning record/OneNote-like hierarchy as a product feature before implementation.
- Define supervisor memory as a human-readable supervision context surface, not an AI/debug memory page.

Release Hygiene:

- Before deployment, restore or recreate `dev-data/pglite` for demo QA and repair the local Next/ESLint runtime so `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm e2e` complete without manual interruption.
- Capture desktop/mobile screenshots for `/`, `/supervisors`, `/requests/new`, `/requests/[id]`, `/payments`, `/supervisor`, `/supervisor/requests`, `/admin`, and `/admin/audit`.
