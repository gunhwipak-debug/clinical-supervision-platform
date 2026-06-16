# ClinicFlow Current Design Contract

## Authority

이 문서는 현재 ClinicFlow 디자인 계약입니다. 14개 Origin PNG는 현재 시각 baseline이며, 44/46 route evidence는 구현 증거이지 새로운 디자인 source가 아닙니다.

Origin-14 is the baseline, not the ceiling. It prevents regression into generic AI card UI, but it must not block clearer desktop workbench layouts.

Active source-of-truth hierarchy:

1. `AGENTS.md`
2. `docs/ui-ux/clinicflow-origin14-design-system.md`
3. `docs/ui-ux/clinicflow-current-design-contract.md`
4. `docs/ui-ux/clinicflow-route-alignment-manifest.md`
5. `docs/ui-ux/clinicflow-ia-navigation-refactor-plan.md`
6. `scripts/clinicflow-origin14-guard.mjs`
7. `demo-evidence/rebuild-tech-ui/SCREENSHOT_MANIFEST.md`
8. `demo-evidence/rebuild-tech-ui/README.md`

과거 audit/report는 판단 참고자료이지 현재 지시가 아닙니다. 특히 아래 문서는 superseded 또는 historical reference입니다.

- `docs/_archive/2026-06-15/old-prompts/codex-piped-quiche.md`
- `demo-evidence/DESIGN-HANDOFF.md`
- `demo-evidence/DESIGN-HANDOFF.json`
- `demo-evidence/STITCH-PROMPTS.md`
- `demo-evidence/STITCH-PROMPTS.json`
- `designs/stitch/**`
- `docs/_archive/2026-06-15/legacy-deployment/NETLIFY_DEPLOYMENT.md`
- `demo-evidence/user-journey-audit/**`
- `demo-evidence/role-matrix-audit/**`
- `demo-evidence/interaction-audit/**`

archived 또는 historical 문서가 active source와 충돌하면 active source가 우선합니다.

## 기준면

최상위 baseline 디자인은 `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400`에 있는 14개 승인 PNG입니다.

이 14개 PNG는 "비교 대상"이 아니라 실제 route를 확장할 때 따라야 하는 baseline 디자인 시스템입니다. 이후 생성된 44개 route screenshot, 과거 Apple 시안, Stitch/Material 계열 화면, generic SaaS dashboard 화면이 이 14개와 충돌하면 14개 원본이 우선합니다. 다만 더 명확한 desktop workbench를 위해 작은 제목, 촘촘한 표, 안정적인 app chrome, 덜 둥근 sidebar가 필요한 경우에는 Origin-14 표면 패턴을 그대로 보존하지 않아도 됩니다.

정적 HTML은 `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`에 보관된 리뷰용 증거입니다. 실제 앱 source는 이 HTML을 런타임에서 읽거나 Tailwind scan 대상으로 삼지 않습니다. HTML이 14개 PNG와 달라졌다면 14개 PNG를 먼저 맞춘 뒤 증거 HTML을 다시 동기화합니다.

이 기준은 과거 템플릿, Apple 시안, SaaS 카드 대시보드가 아니라 다음 14개 승인 화면에서 출발합니다.

- 홈
- 슈퍼바이저 찾기
- 로그인
- 진행 방식
- 새 슈퍼비전 의뢰
- 사례 자료 정리
- 의뢰 상세
- 결제 내역
- 수락 대기
- 학습 기록
- 슈퍼바이저 업무
- 슈퍼바이저 검토 화면
- 자격 심사
- 운영 화면

## 아키텍처 원칙

- 전역 헤더는 공개 안내에 필요한 `슈퍼바이저 찾기`, `이용 가이드`, `로그인`, 보조 CTA만 보여줍니다.
- `사례 자료`, `수락 대기`, `학습 기록`, 관리자/슈퍼바이저 업무 같은 역할별 작업은 전역 헤더에 올리지 않습니다.
- 중간 상태는 해당 route 내부의 진행 바와 primary action에서만 보여줍니다.
- 공개 페이지는 서비스 이해와 시작을 돕고, 업무 페이지는 필요한 현재 상태와 실제 행동만 강조합니다.
- route가 없거나 데이터가 없을 때도 과거 템플릿을 재사용하지 않고, 같은 디자인 언어의 route-specific fallback을 보여줍니다.

## Origin-14 Non-Regression Rule

- 새 화면을 만들 때는 먼저 `docs/ui-ux/clinicflow-route-alignment-manifest.md`에서 기준 원형을 확인합니다.
- 기준 원형이 없으면 새 디자인을 만들지 않고 가장 가까운 14개 원형 중 하나를 확장합니다.
- 44개 route screenshot은 결과 증거일 뿐 source of truth가 아닙니다.
- 로그인/권한 잠금 화면도 원형의 배경, 폭, 타이포그래피, CTA 밀도를 따라야 합니다. 빈 fallback 카드로 넓은 화면을 비워두지 않습니다.
- admin/supervisor 내부 화면도 별도 dashboard 미학을 만들지 않고 `운영 처리 목록`, `자격 심사`, `슈퍼바이저 업무`, `슈퍼바이저 사례 검토` 원형을 확장합니다.

## Minimalist Modern 보조 프롬프트 적용

사용자가 추가 제공한 `Minimalist Modern` 프롬프트는 origin-14를 대체하지 않고 보강합니다.

- 적용: electric blue emphasis, 구조적 여백, bold detail, 대비 섹션, premium하지만 절제된 hierarchy.
- 비적용: Calistoga 영문 headline, 과한 decorative motion, 섹션마다 반복되는 badge/pill, 불필요한 gradient 장식.
- 한국어 제품 기준: `Noto Sans KR` 우선, `#081225` ink, `#2563ff` action, `#e7ebf1` line, 흰 배경, line-list와 단일 side panel.
- 토큰 기준: `packages/design-tokens/src/tokens.ts`와 `tokens.css`는 Origin-14 팔레트를 기준으로 동기화합니다. 과거 Stitch 계열의 `#F9F9FF`, `#0058BE`, `#2170E4` 같은 색상은 새 route 확장 기준으로 사용하지 않습니다.

## Posteady Structural Reference

Posteady는 desktop workbench IA를 참고하기 위한 구조 레퍼런스일 뿐이며, ClinicFlow의 색상, 폰트, 브랜드 톤, 카드 스타일, 문구 기준을 대체하지 않습니다. 공개 홈의 실제 제품 preview, 로그인 후 고정 좌측 역할 탐색, compact grouped navigation, row/list/table 중심 업무 영역만 Origin-14 문법 안에서 차용합니다.

## ClinicFlow Desktop Workbench v2

ClinicFlow Desktop Workbench v2는 로그인 후 업무 화면의 현재 목표입니다.

- Fixed desktop app chrome: 좌측 역할 탐색은 floating content card가 아니라 안정적인 앱 작업대처럼 보여야 합니다.
- Compact role sidebar: 220-260px 범위에서 그룹, 현재 위치, 계정 맥락을 간결하게 보여줍니다.
- Utility top bar: 전역 workflow 링크를 넣지 않고 계정, 역할, 현재 작업 맥락만 보조합니다.
- Workbench content area: page header는 짧고, 본문은 row/list/table 중심으로 판단과 작업을 빠르게 합니다.
- Compact empty states: 빈 화면은 표/행 frame 안에서 짧게 설명하고, 별도 설명 카드로 공간을 채우지 않습니다.
- Public landing preview: 공개 홈은 큰 문장만 보여주지 않고 실제 ClinicFlow 흐름을 첫 화면에서 보여줍니다.
- No generic explanatory panels: 설명 패널, 다음 행동 배너, 요약 카드가 기본 구조가 되지 않습니다.

## 화면 구조

- 한 화면에는 하나의 primary action만 둡니다.
- 기본 구조는 `PageHeader -> primary content`입니다.
- next-action panel은 사용자가 즉시 결정하거나 막힌 행동이 있을 때만 사용합니다.
- summary panel은 반복 정보를 줄이거나 결정을 도울 때만 사용합니다.
- work page는 큰 상단 action panel과 right summary panel을 동시에 갖지 않는 것을 기본으로 합니다.
- 보조 정보는 필요할 때만 고정 사이드 패널 하나로 압축합니다.
- 카드 그리드, 중복 패널, 메타데이터 박스 나열은 피합니다.
- 줄 단위 정보에는 `제목`, `한 문장 설명`, 필요 시 작은 상태값만 둡니다.
- 한국어 UI는 `Noto Sans KR`를 우선하고, 버튼/상태/라벨은 14px 이상을 기본으로 합니다.

Copy budget:

- one H1
- one short page description
- one primary CTA
- compact status text only where needed
- no repeated helper paragraph that restates a heading, row, or button

## 금지 패턴

- 전역 헤더에 workflow 중간 단계 노출
- 같은 화면 안의 다중 사이드 패널
- dark hero panel + upload panel + checklist panel + summary panel 조합
- naked number metric 카드
- 구버전 fallback route 재사용
- `자료실`, `지도자`, `페이지 이동`, `보안 로그인`, `PHI`, `LOG` 같은 내부/부적절 표현
- 과한 round, shadow, gradient, glass effect
- `glass-card`, `bento-*`, 반복 body override, route별 샘플 CSS 같은 구버전 전역 스타일

## Route Coverage

전체 route surface는 `docs/ui-ux/clinicflow-full-route-frontend-implementation.md` 기준 44개 page template입니다.
route별 정렬 기준은 `docs/ui-ux/clinicflow-route-alignment-manifest.md`를 authoritative ledger로 사용합니다.

- Web app: 35 pages
- Admin app: 9 pages

14개 승인 섹션은 대표 디자인 원형이고, 나머지 route는 실제 React page/component가 같은 문법을 따릅니다. 과거 static preview component는 실제 앱 source에서 제거되어야 하며, 새 route를 만들 때는 preview HTML을 런타임에 읽는 방식이 아니라 origin-14 원형을 React 구조로 확장합니다.
즉, "14개 화면"은 전체 route 수가 아니라 디자인 원형 수입니다.

단, page file 존재와 판매 가능한 완성도는 구분합니다.

- `production`: 실제 세션, 데이터, 권한, API 흐름으로 렌더링되는 route입니다.
- `preview-only`: 승인 UI를 보여주지만 아직 실제 데이터/상호작용이 연결되지 않은 route입니다.
- `locked-state`: 로그인이나 권한이 없을 때 실제 운영 화면 대신 안내를 보여주는 route입니다.
- `alias/redirect`: 같은 기능 화면으로 연결하기 위한 호환 route입니다.

현재 public discovery surface 중 `/`, `/login`, `/supervisors`, `/supervisors/[id]`는 실제 React page 또는 form/API/DB 함수 흐름을 사용합니다. `/guide`, `/resources`는 프리뷰 컴포넌트가 아니라 같은 디자인 언어의 실제 정적 안내 페이지입니다. 실제 판매 가능 상태로 보려면 세션 선택, 일정 선택, 결제와 파일 업로드까지 production 환경에서 이어지는지 확인해야 합니다.

역할별 업무 route(`/requests`, `/requests/new`, `/requests/[id]`, `/payments`, `/case-archive`, `/settings`, `/supervisor/*`, `/admin/*`)는 실제 page가 있으나, 디자인 검증 시 승인 14개 섹션의 문법과 비교해야 합니다.

## Header Contract

- 공개 화면: `ClinicFlow`, `슈퍼바이저 찾기`, `이용 가이드`, `로그인`, 보조 CTA만 노출합니다.
- 로그인 후 업무 화면: 전역 헤더의 새 신청 CTA는 숨기고, 각 page header의 primary action만 남깁니다.
- 전역 헤더에는 `자료`, `결제`, `수락 대기`, `학습 기록`, `운영`, `검토` 같은 역할별 route를 넣지 않습니다.

## Actual Route Alignment Ledger

### 정렬 완료

- `SiteHeader`: 공개 탐색만 남기고 중간 업무 메뉴와 role별 작업 링크를 제거했습니다.
- `AppShell`: 로그인 후 업무 화면에서는 전역 CTA와 로그인 버튼을 숨기고 page header action만 남깁니다.
- `/`: static preview component를 제거하고, 서비스 정의, 진행 흐름, 제출/피드백/학습 기록 설명이 이어지는 실제 React homepage로 정리했습니다.
- protected supervisee/supervisor routes: 로그인 전에는 과거 데모 프리뷰를 보여주지 않고, 같은 shell 안에서 로그인 안내만 보여줍니다.
- `/login`: static preview가 아니라 실제 `LoginForm`을 렌더링합니다.
- `/supervisors`, `/supervisors/[id]`: static preview가 아니라 `profiles.searchSupervisors`, `profiles.getPublicSupervisorDetails` 기반으로 렌더링합니다. DB 연결이 없으면 같은 디자인 언어의 empty/error state로 떨어집니다.
- `/guide`, `/resources`: static preview component를 제거하고, 진행 방식과 자료 기준을 line-by-line 구조의 실제 React page로 정리했습니다.
- `/requests`: active request list를 다음 행동 중심의 line-by-line 구조로 정렬했습니다.
- `/requests/new`: 슈퍼바이저 확인, 세션 확인, 일정 확인, 초안 저장 순서의 compact step flow로 정렬했습니다. 사례 자료는 의뢰 ID 생성 뒤 `/requests/[id]#case-files`에서 이어서 정리합니다.
- `/requests/new`는 초기 14개 원형의 시각 문법을 따르되, 최신 사용자 피드백에 따라 `자료 업로드`를 진행 위치로 표시하지 않습니다. 이 화면의 진행 위치는 `세션·일정`, primary action은 `신청 초안 저장`이며, 실제 자료 정리는 의뢰 ID가 생긴 뒤 `/requests/[id]#case-files`의 `사례자료 정리` 단계에서 이어집니다.
- `/requests/[id]`: 상태, 사례 정보, 첨부 자료, 필요한 진행 사실만 1 main + optional compact side panel 구조로 정렬했습니다. 상단 상태 영역은 체크리스트형 dark panel을 제거하고 현재 상태와 한 개 primary action만 보이게 낮췄습니다.
- `CaseFilesPanel`: 산만한 카드 묶음 대신 `자료 업로드 -> 파일 한 줄 목록 -> 선택한 자료 확인`으로 정리했습니다. 파일 목록에는 `열기`만 남기고, 선택한 파일의 작업 버튼은 미리보기 아래 한 줄 묶음으로 낮췄습니다. 페이지 메모와 삭제 같은 보조 작업은 접힌 영역으로 낮췄습니다.
- `/admin`: admin app root `/`는 `/admin`으로 redirect하고, canonical 운영 홈은 `AdminShell` 기반으로 통일했습니다.
- `/requests`, `/payments`, `/supervisor`: page header CTA와 primary action panel CTA가 동시에 경쟁하지 않도록 header action을 제거했습니다.
- static design source: 한국어 폰트 우선순위, 라벨/상태 글자 크기, CJK 줄바꿈, 업로드 CTA 문구를 50-60대 초심자 기준으로 조정했습니다.
- `/payments/[id]`: 결제 상세를 `결제 상태 -> 결제 정보 -> 금액 세부 내역 -> 필요한 환불 요청`의 1 main + optional compact side panel 구조로 정렬했습니다.
- `/case-archive`: 슈퍼바이저별 folder-like learning record 구조로 정렬했습니다.
- `/supervisor`: 숫자 카드 중심 dashboard 대신 오늘 처리할 의뢰 중심으로 정렬했습니다.
- `/supervisor/availability`: AppShell과 1 main + 1 side panel 구조로 옮기고, 화면 문구를 `일정 연동`, `가능 시간`, `외부 일정` 중심으로 정리했습니다.
- `/supervisor/requests/[id]`: 검토 workspace를 `검토 상태 -> 사례 요약 -> 첨부 자료 -> 처리 작업/기록` 중심으로 정렬했습니다. next-action panel은 막힌 처리 단계에서만 사용합니다.
- `/supervisor/profile`, `/supervisor/products`: 별도 bottom nav를 제거하고 AppShell 안의 one-action layout으로 정렬했습니다. `제공 항목`은 `슈퍼비전 방식`, `세션명`으로 정리했습니다.
- `/admin/*`: 관리자 shell에 운영 처리 기록(`처리 기록`)까지 포함했습니다.
- `/admin/queue`, `/admin/qualifications`, `/admin/refunds`, `/admin/payouts`, `/admin/audit`: 로그인 후에도 같은 `AdminShell` 좌측 내비와 line-list 구조를 사용하도록 정리했습니다. 별도 sticky top bar와 독립 카드 stack은 제거했습니다.
- `/admin/payouts`: 큰 숫자 카드 두 장 대신 정산 기간, 요약, 계산 패널, 정산 항목 line-list로 정리했습니다.
- 3차 pass: `/requests/[id]`는 page-level action banner를 제거하고, 본문은 의뢰 정보/사례 자료/첨부 자료, 우측은 반복을 줄이는 진행 사실과 primary action만 담당합니다. 학습 기록은 `completion_record_issued` 또는 `completed` 상태에서만 노출합니다.
- 3차 pass: `/supervisor/requests`는 상태, 의뢰명, 일정/보관, 한 개 작업 버튼이 한 행에 보이는 table-like list로 낮췄습니다. 보조 진입 버튼은 우측 요약 패널에서 제거해 요청 목록과 경쟁하지 않게 했습니다.
- 3차 pass: `/admin/refunds`, `/admin/payouts`, `/admin/audit`는 상단 설명 카드 묶음을 제거하고, row/table-first 목록을 기본으로 둡니다. 우측 패널은 필터, 계산, 선택 항목처럼 실제 작업을 줄일 때만 남깁니다. 환불 결정 버튼은 행의 단일 `환불 처리` 컨트롤 안에서만 드러납니다.
- 3차 pass IA labels: `케이스 아카이브`, `결제 내역`, `가능 시간`, `자격 정보`, `감사 로그`, `환불`, `정산`, `대기열`을 현재 최종 라벨로 유지합니다.
- `/supervisor/payouts`: 상단 KPI 카드와 분리된 정산 카드들을 하나의 정산 기록 표와 하나의 요약 레일로 압축했습니다.
- `/supervisor/profile`: 구형 token/form surface를 현재 shell/card 언어로 맞추고, 공개 상태는 하나의 side panel로 정리했습니다. 내부 sticky 미리보기 패널은 제거하고 본문 하단 접힘 섹션으로 낮췄습니다.
- `/supervisor/availability`: 보조 CTA와 분산된 일정 연동/저장 패널을 줄이고, 가능한 시간과 일정 요약 중심으로 정리했습니다. 내부 일정 연동은 접힌 보조 섹션으로 낮춰 바깥 요약 패널과 경쟁하지 않게 했습니다.
- `/requests/[id]`: page-level 중복 action panel을 제거하고, 사례 자료와 첨부 자료를 본문에, 현재 상태/일정/자료 보관은 하나의 진행 요약 side panel에 모았습니다. 드래프트 상태에서는 결제/마무리 영역을 숨기고, 개인정보 확인은 접힌 보조 확인으로 낮췄습니다.
- `/notifications`: 지금 확인할 알림 하나를 먼저 보여주고, 나머지는 `알림 기록` line-list로 낮췄습니다.
- `/settings`: 카드형 계정 dashboard를 제거하고, 본문은 기본 계정과 신청자 프로필만 남겼습니다. 슈퍼바이저 업무 진입은 하나의 계정 확인 side panel 안으로 낮췄습니다.
- `/supervisor/requests`: 지금 처리할 의뢰만 전면에 두고 예약·결제 대기, 완료·보관, 닫힌 의뢰는 접힌 보조 묶음으로 낮췄습니다.
- Posteady structural pass: `/`는 장식 카드 대신 실제 workflow preview와 `슈퍼바이저 찾기`, `의뢰 작성`, `자료 제출`, `피드백 확인`, `케이스 아카이브` segmented preview를 제공합니다.
- Posteady structural pass: `/requests`는 카드형 목록 대신 상태별 workbench strip과 row/table 목록으로 정리했습니다. 각 행은 의뢰 ID, 제목, 슈퍼바이저, 상태, 일정/결제 신호, 한 개의 주요 작업 버튼만 가집니다.
- `/supervisor/memory`: 전용 노트 CRUD가 없는 현재 상태를 과장하지 않도록 화면명을 `기록 폴더`로 낮췄습니다.
- `/supervisor/qualifications`: 구형 카드형 자격 관리 화면을 `제출한 자격` line-list와 하나의 `자격 증빙 제출` side panel로 정리했습니다.
- `/me`: 모든 사용자를 슈퍼바이저 홈으로 보내던 alias를 역할별 시작점으로 분기했습니다. 신청자는 `/requests`, 슈퍼바이저는 `/supervisor`, 관리자는 web 앱 내부 계정 화면인 `/settings`로 이동합니다.
- auth pages: 회원가입과 이메일 확인 화면을 로그인 화면과 같은 밀도와 폰트 체계로 낮췄습니다.
- public policy pages: 이용 가이드가 아닌 정책성 페이지에서 guide 활성 상태와 과한 하단 링크가 반복되지 않도록 정리했습니다.
- `/admin`: `운영 대시보드` 표현을 `운영 홈`으로 정리하고, 카운트는 처리 대기 여부를 알려주는 보조 상태로 낮췄습니다.
- shared `Card`, `PrimaryActionPanel`, 주요 supervisor/payment/admin surfaces: 기본 heavy shadow를 제거해 카드 대시보드 느낌을 낮췄습니다.
- static design source: 실제 앱 source가 아닌 `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`을 리뷰용 증거로 보관합니다. 런타임 앱은 static preview HTML을 읽지 않습니다.

### 추가 정렬 필요

- `/requests/new`: 의뢰 생성 후 `/requests/[id]#case-files` 자료 정리 영역으로 바로 이동합니다. 현재 화면은 자료 업로드까지 한 화면에서 약속하지 않고, 초안 저장 뒤 의뢰 상세에서 사례 자료를 정리하는 구조로 명확히 분리했습니다. 최종 판매 버전에서 선업로드가 필요하다면 별도 데이터/스토리지 흐름으로 연결해야 합니다.
- `CaseFilesPanel`: 기본 화면의 산만함은 줄였지만, 장기적으로는 자료 미리보기, 페이지 메모, 슈퍼바이저의 추가 자료 요청을 별도 검토 모드로 더 분리하는 편이 좋습니다.
- `/supervisor/memory`: route는 있으나 전용 노트 CRUD가 아니라 의뢰 데이터에서 파생한 폴더형 보기입니다. 원노트식 지속 기록으로 팔려면 별도 데이터 모델/편집 흐름이 필요합니다.
- Public discovery(`/`, `/supervisors`, `/supervisors/[id]`, `/guide`, `/resources`)는 승인 preview 스타일을 보여주지만 production 데이터 연결은 아직 제한적입니다.

## 백엔드/판매 준비 범위

이번 문서는 UI 기준을 고정합니다. 즉각 판매 가능한 제품이 되려면 별도 release-readiness에서 다음을 검증해야 합니다.

- 실제 Supabase 데이터 흐름
- 파일 업로드와 미리보기 변환
- 결제 staging/production e2e
- 이메일/알림 발송
- 관리자 운영 SOP
- 개인정보 및 약관 검토
