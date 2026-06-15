# ClinicFlow Release Readiness Gap List

## 기준

현재 UI 기준은 `docs/ui-ux/clinicflow-current-design-contract.md`와 `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400`의 origin-14 PNG입니다. 정적 HTML은 `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`에 보관된 리뷰 증거이며, 실제 앱 source에서 런타임 preview로 읽지 않습니다.
전체 route와 승인 UI 원형의 대응표는 `docs/ui-ux/clinicflow-route-alignment-manifest.md`입니다.

이 문서는 UI 기준을 실제 판매 가능한 서비스로 연결하기 위해 남은 백엔드, 운영, 배포 검증 항목만 분리합니다. UI 화면을 다시 설계하는 문서가 아닙니다.

현재 판정은 `즉각 공개 판매 가능`이 아니라 `closed beta 준비 중`입니다. 인증, 요청, 결제, 파일 업로드, 관리자 화면의 실제 코드 흐름은 있으나, 실환경 E2E와 운영 검증이 아직 부족합니다.

## R1. 계정과 권한

- 가입, 로그인, 비밀번호 재설정, 이메일 확인이 production 환경에서 동작해야 합니다.
- 신청자, 슈퍼바이저, 관리자 권한이 각 route에서 실제로 분리되어야 합니다.
- 권한이 없는 사용자는 사용자 언어의 안내 화면으로 이동해야 합니다.
- 현재 `/login`은 static preview가 아니라 실제 로그인 form을 렌더링합니다.
- 현재 protected supervisee/supervisor route는 로그인 전 demo preview를 노출하지 않고 locked 안내를 보여줍니다.

검증:

- `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/email/verify`
- `/requests`, `/supervisor`, `/admin`

## R2. 슈퍼바이저 찾기와 신청 흐름

- 슈퍼바이저 목록, 상세, 제공 항목, 가능 일정이 실제 데이터로 표시되어야 합니다.
- 새 의뢰는 `슈퍼바이저 -> 세션 -> 일정 -> 사례 자료 -> 확인·결제` 순서로 끊기지 않아야 합니다.
- 전역 헤더에는 중간 단계가 노출되지 않아야 합니다.

검증:

- `/supervisors`
- `/supervisors/[id]`
- `/requests/new`

현재 판단:

- `/supervisors`, `/supervisors/[id]`는 static preview가 아니라 실제 공개 프로필 DB 함수로 렌더링합니다.
- `/requests/new`는 현재 슈퍼바이저, 세션, 일정 확인 뒤 의뢰 초안을 저장하고 `/requests/[id]#case-files`로 이동합니다. 자료 업로드가 전역 헤더나 새 의뢰 화면에 섞이지 않도록 분리했습니다.
- 남은 gap은 실제 운영 데이터, 공개 프로필 검수, 가능 일정, 세션 선택, 의뢰 생성, 결제로 이어지는 end-to-end smoke입니다.
- 따라서 지금 상태는 “public supervisor discovery frontend 연결 완료”에 가깝지만, 아직 판매 가능한 marketplace signoff는 아닙니다.

## R3. 사례 자료 업로드와 미리보기

- PDF, HWPX, DOCX, XLSX 등 허용 파일이 실제 저장소에 올라가야 합니다.
- 업로드 화면은 한 primary action과 한 요약 패널만 유지해야 합니다.
- 업로드 후 의뢰 상세에서 파일 목록, 상태, 추가 자료 요청을 확인할 수 있어야 합니다.
- 현재 자료 panel은 선택 전부터 여러 작업 패널을 펼치지 않고, 사용자가 파일을 `열기`로 선택한 뒤 자료 확인 영역을 보여주는 구조로 정리했습니다. 선택한 파일의 작업 버튼은 미리보기 아래 한 줄 묶음으로 낮추고, 페이지 메모와 삭제 같은 보조 작업은 접힌 영역으로 낮췄습니다.
- 현재 의뢰 상세는 사례 자료와 첨부 자료를 본문에 두고, 상태/일정/자료 보관은 하나의 진행 요약 side panel로 정리했습니다.
- 현재 새 의뢰 화면은 자료 업로드를 약속하지 않고 초안 저장까지만 담당합니다. 실제 파일 선택, 자료 목록, 보완 자료 요청은 의뢰 상세의 자료 정리 영역에서 다룹니다.

검증:

- `/requests/new`
- `/requests/[id]`
- 파일 업로드 API
- 저장소 접근 권한

## R4. 결제와 환불

- 결제 승인, 실패, 중복 승인, 금액 불일치가 실제 PG 환경에서 확인되어야 합니다.
- 결제 확인 화면은 기술 용어가 아니라 사용자 언어로 상태를 설명해야 합니다.
- 환불 심사는 관리자 화면에서 의뢰, 금액, 사유, 진행 상태를 한 줄씩 확인할 수 있어야 합니다.
- 관리자 환불/정산 화면은 `AdminShell` 안의 line-list 구조로 정리했지만, 실제 PG 환불과 정산 집행은 운영 E2E로 별도 검증해야 합니다.

검증:

- `/payments`
- `/payments/[id]`
- `/payments/confirm`
- `/admin/refunds`

## R5. 슈퍼바이저 검토와 피드백

- 슈퍼바이저는 오늘 먼저 볼 의뢰, 추가 자료 도착, 피드백 작성 중 항목을 실제 큐로 확인해야 합니다.
- 의뢰 상세에서는 자료, 맥락, 피드백 작성, 추가 자료 요청이 같은 작업 흐름 안에 있어야 합니다.
- 피드백 제출 후 신청자 화면에 상태가 반영되어야 합니다.

검증:

- `/supervisor`
- `/supervisor/requests`
- `/supervisor/requests/[id]`
- `/requests/[id]`

현재 판단:

- `/supervisor/profile`과 `/supervisor/availability`의 내부 중복 side panel은 제거했습니다. 각 화면은 바깥 side panel 하나만 유지하고, 미리보기/외부 일정 연동은 접힌 보조 섹션으로 낮췄습니다.
- `/requests/[id]`는 드래프트 단계에서 결제/마무리 영역을 숨기고, 개인정보 제거 확인을 접힌 보조 확인으로 낮췄습니다. 다만 최종 판매 전에는 사례 정보, 첨부 자료, 결제, 피드백 완료를 상태별 단일 작업 화면으로 더 분리하는 편이 좋습니다.
- `/supervisor/requests`는 지금 처리할 의뢰만 전면에 두고, 다른 상태는 접힌 보조 묶음으로 낮췄습니다.
- `/supervisor/memory`는 전용 노트 모델이 없으므로 화면명을 `기록 폴더`로 낮췄습니다. 지속 편집형 노트는 신규 기능/데이터 모델 항목입니다.

## R6. 학습 기록

- 완료된 슈퍼비전은 파일 목록이 아니라 슈퍼바이저별 폴더 구조로 정리되어야 합니다.
- 각 기록은 피드백, 보완 자료, 완료 기록으로 바로 이어져야 합니다.

검증:

- `/case-archive`
- `/supervisor/memory`

## R7. 관리자 운영

- 자격 심사, 운영 대기열, 환불, 정산, 감사 기록이 각각 실제 데이터로 표시되어야 합니다.
- 관리자 화면은 장식보다 검색, 필터, 상태, 처리 버튼이 우선이어야 합니다.
- 현재 admin 하위 화면은 로그인 후에도 같은 `AdminShell` 좌측 내비를 사용하며, 별도 sticky top bar와 큰 숫자 카드 중심 화면은 제거했습니다.

검증:

- `/admin`
- `/admin/queue`
- `/admin/qualifications`
- `/admin/refunds`
- `/admin/payouts`
- `/admin/audit`

## R8. 배포와 QA

- `typecheck`, `lint`, `build`, 핵심 route smoke test가 안정적으로 통과해야 합니다.
- 2026-06-15 기준 44개 route HTTP smoke는 `.omo/evidence/route-smoke-20260615T010842`에서 web 35개, admin 9개 모두 200으로 통과했습니다. 이 증거는 알림/설정/새 의뢰 UI 정리 직전의 route surface 기준입니다.
- 2026-06-15 기준 전체 route screenshot QA는 `demo-evidence/route-alignment-qa/20260615T012142`에 44개 PNG와 manifest를 남겼습니다. 이 증거도 알림/설정/새 의뢰 UI 정리 직전의 시각 기준입니다.
- 최신 UI 정리 후 `git diff --check`와 touched-file prettier는 통과했습니다.
- 최신 UI 정리 후 변경 TSX 파일들은 TypeScript parser 기준 문법 오류가 없습니다.
- 현재 로컬에서 기본 `pnpm --filter @csp/web typecheck`, targeted `eslint`, `next dev --port 3000`이 출력 없이 멈추는 현상이 반복되어, 릴리즈 전 검증 명령 병목을 먼저 분리해야 합니다.
- 단, 이전 측정에서는 `tsc --noEmit --incremental false --pretty false`가 web/admin 모두 빠르게 종료되어 빠른 릴리즈 체크로 쓸 수 있었습니다. 최신 UI 정리 직후에는 같은 direct tsc와 workspace typecheck가 다시 장시간 무출력으로 멈췄으므로, 해당 병목은 재분리해야 합니다.
- 빠른 릴리즈 체크는 ignored `tsconfig*.tsbuildinfo`를 먼저 정리해 stale TypeScript cache로 인한 장시간 대기를 줄입니다.
- `pnpm exec tsx` 기반 컴포넌트 import smoke도 `Error: The service was stopped`로 실패한 기록이 있어, esbuild/Node 24/pnpm runtime 조합을 별도 점검해야 합니다.
- `node node_modules/next/dist/bin/next --version`과 `node node_modules/eslint/bin/eslint.js --version` 같은 최소 CLI도 출력 없이 멈추는 경우가 있어, 단순 배포 지연이 아니라 로컬 Node CLI 실행 병목으로 분리합니다.
- `@playwright/test`는 설치되어 있으나 정적 HTML 캡처 스크립트도 60초 이상 출력 없이 멈춘 기록이 있어, 자동 브라우저 QA는 런타임 복구 후 재실행해야 합니다.
- Vercel preview URL에서 public, supervisee, supervisor, admin 주요 화면을 캡처해야 합니다.
- Supabase production/staging 연결 상태를 화면별로 확인해야 합니다.
- 과거 static preview component와 `apps/web/src/design-sources` HTML 중복본은 실제 앱 source에서 제거했습니다. 44개 page template은 static HTML을 런타임에 읽지 않고 실제 React route/component로 origin-14 문법을 확장해야 합니다.
- 최신 UI 정리 뒤 `.next` cache를 지우고 재실행한 route smoke는 서버 ready 상태에 도달하지 못했습니다. `.omo/evidence/route-smoke-20260615T014458`는 실패 증거이며, 성공 증거로 사용하지 않습니다.
- 추가 재측정 `.omo/evidence/next-startup-20260615T020927`: `apps/web`에서 Next dev를 직접 실행했지만 90초 동안 `/login` first byte가 오지 않았습니다. 로그는 거의 비어 있고, `sample`은 `next-swc.darwin-arm64.node`의 tokio worker 대기를 보여줍니다.
- 추가 재측정 `.omo/evidence/web-typecheck-20260615T021846.*`: web direct `tsc --noEmit --incremental false --pretty false`가 61초 무출력 timeout으로 중단됐습니다. 샘플은 TypeScript 진단 출력 전 Node/V8 실행 경로에 머물렀습니다.
- 현재 시스템 Node는 `v24.14.1`, Codex 번들 Node는 `v24.14.0`이라 Node 버전 대안이 되지 않습니다. 임시 `npx -y node@22 -v`도 90초 이상 무출력으로 중단되어, Node 20/22 LTS 재검증은 별도 환경 정리가 필요합니다.

최근 재측정:

- `node -e 'console.log(process.version)'`: 통과, Node `v24.14.1`
- `pnpm --version`: 통과, pnpm `11.1.2`
- installed engines: Next `^18.18.0 || ^19.8.0 || >= 20.0.0`, ESLint `^18.18.0 || ^20.9.0 || >=21.1.0`, TypeScript `>=14.17`
- `node node_modules/typescript/bin/tsc --version`: 통과, TypeScript `5.9.3`
- `apps/web/tsconfig.json` 입력 분석: 158 files, config parse error 0
- `apps/web/src/components/ui/button.tsx`: dynamic JSX component inference를 조건부 return으로 단순화한 뒤 단일 파일 타입체크가 30초 timeout에서 0.7초 통과로 개선됨
- `apps/web/src/components/case-files-panel.tsx`: 파일 업로드 검증의 zod resolver를 field-level validate로 단순화한 뒤 단일 파일 타입체크가 20초 timeout에서 6.8초 통과로 개선됨. 이후 파일 확인 패널은 기본 상태/핵심 버튼만 노출하고 메모/관리 작업은 접힌 영역으로 낮춤
- `pnpm --filter @csp/web typecheck`: 통과
- `pnpm --filter @csp/admin typecheck`: 통과
- `pnpm release:web:fast-check`: 통과, 20260614T151357. `git diff --check`, changed-file prettier, preview source sync, web/admin non-incremental typecheck 통과. local web build는 `FULL_BUILD=1`일 때 별도 실행하도록 skip됨.
- ignored `tsconfig*.tsbuildinfo` cleanup 후 `pnpm --filter @csp/web typecheck`: 통과
- ignored `tsconfig*.tsbuildinfo` cleanup 후 `pnpm --filter @csp/admin typecheck`: 통과
- 직접 Node 바이너리 기준 `node node_modules/next/dist/bin/next --version`: 통과
- 직접 Node 바이너리 기준 `node node_modules/eslint/bin/eslint.js --version`: 통과
- `import('typescript-eslint')`: Node 24에서 96.19초 후 통과. CPU 사용량은 낮아 코드 오류보다 `node_modules/.pnpm` package import/file I/O 지연에 가깝습니다.
- `import('@next/eslint-plugin-next')`: 통과
- `next dev` local route smoke: 90초 동안 port 미오픈, `sample`상 `next-swc.darwin-arm64.node` tokio worker 경로에서 대기
- 재측정: `pnpm dev:web`, `pnpm dev:admin`은 각각 3000/3001 port를 열었지만 `/login`, `/admin` HTTP 요청이 30초 동안 0 bytes로 timeout됨. 타입체크는 통과하므로 UI 변경 자체보다 로컬 Next runtime 응답 병목으로 분리합니다.
- ignored cache cleanup 후 `pnpm --filter @csp/web build`: 300초 timeout, `Creating an optimized production build ...` 이후 진행 없음
- `pnpm lint`: 3분 30초 이상 무출력으로 중단. `typescript-eslint` 단독 import가 약 96초 소요되므로 전체 ESLint는 릴리즈 전 별도 긴 검증으로 분리합니다.
- `pnpm --filter @csp/web build`: 4분 이상 무출력으로 중단
- `pnpm --filter @csp/admin build`: 4분 이상 무출력으로 중단
- `.nvmrc`, `.node-version`, `mise.toml`, `.tool-versions`: 현재 repo root 주변에서 확인되지 않음
- 2026-06-15 최신 Origin-14 guardrail pass:
  - `pnpm origin14:check -- --evidence .omo/evidence/origin14-guard-route-archetype.json`: 통과, 25/25
  - route manifest가 실제 44개 page template을 정확히 한 번씩 매핑하는지 검사하도록 추가됨
  - 각 route surface가 Origin-14 shell 또는 archetype primitive 없이 독립 화면으로 생기면 실패하도록 추가됨
  - `/requests/new`가 다시 `자료 업로드` 화면처럼 보이거나 `현재 단계` 라벨을 노출하면 실패하도록 추가됨
  - `pnpm origin14:check`: 같은 Origin-14 기준선 검사 명령으로 추가됨
  - `scripts/clinicflow-fast-release.mjs`: `release:web:fast-check` 초반에 Origin-14 guard를 실행하도록 연결됨
  - `git diff --check`: 통과
  - `packages/design-tokens` direct typecheck: 통과
  - `workflow-preview-pages.tsx`: 제거됨
  - `apps/web/src/design-sources/clinicflow-tech-preview.html`: 제거됨. 리뷰용 HTML은 `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`에만 보관
  - `apps/web/src/app/globals.css`: `@source "../design-sources"` 제거
  - `NEXT_TELEMETRY_DISABLED=1 pnpm --filter @csp/web dev`: 3000 port를 열지 못한 채 code 137로 종료. 최신 44-route browser QA는 아직 재생성 불가
  - `sample` evidence: `.omo/evidence/next-dev-debug-20260615T-current/web-next-dev.sample.txt`는 Next CLI가 port bind 전 대량 `ReadFileUtf8` 작업에 머무는 상태를 기록
- 2026-06-15 현재 재측정:
  - `pnpm origin14:check -- --evidence .omo/evidence/origin14-guard-final-25.json`: 통과, 25/25
  - `node --check scripts/clinicflow-origin14-guard.mjs`: 통과
  - `git diff --check`: 통과
  - Origin-14 guard/docs 및 최신 payment-confirm UI Prettier check: 통과
  - user-facing rejected-label scan: app/admin UI source에서 `페이지 이동`, `자료실`, `지도자`, `PHI`, `LOG` 등 금지 표현 재유입 없음
  - independent route archetype scan: `44` page templates, weak route surface `0`
  - `pnpm --filter @csp/web typecheck`: `tsc --noEmit` 60초 무출력 hang으로 중단
  - `pnpm --filter @csp/web exec tsc --noEmit --incremental false --pretty false`: 60초 무출력 hang으로 중단
  - 현재 시스템 Node `v24.14.1`, pnpm `11.1.2`, repo root에 `.nvmrc`, `.node-version`, `mise.toml`, `.tool-versions` 없음
- 2026-06-15 온라인 preview 재측정:
  - `scripts/clinicflow-fast-release.mjs`의 Origin-14 guard timeout을 `60s -> 180s`로 늘렸습니다. guard 자체는 통과하지만 현재 파일 I/O 상태에서 60초 제한에 근접해 release wrapper 안에서 실패할 수 있었기 때문입니다.
  - `pnpm release:web:ui-preview`: fast check 구간 통과. Vercel CLI는 `Building...` 직후 exit 1을 반환했지만, 실제 Vercel deployment는 계속 진행되어 Ready 상태가 됐습니다.
  - Web preview URL: `https://clinicflow-30fgcpwpn-gunhwipak-debugs-projects.vercel.app`
  - Web preview smoke: `/` HTTP 200.
  - Vercel cloud build: `pnpm --filter @csp/web build` compiled, type/lint phase passed, 54 static pages generated, deployment Ready.
  - Web current screenshot QA: `demo-evidence/route-alignment-qa/20260615T0145-preview-web-current`, 35/35 web route templates returned HTTP 200 and produced screenshots.
  - Web current contact sheet: `demo-evidence/route-alignment-qa/20260615T0145-preview-web-current/00-contact-sheet.png`.
  - Admin production URL: `https://clinicflow-admin-six.vercel.app`.
  - Admin current screenshot QA: `demo-evidence/route-alignment-qa/20260615T0145-admin-production-current`, 9/9 admin route templates returned HTTP 200 and produced screenshots.
  - Admin current contact sheet: `demo-evidence/route-alignment-qa/20260615T0145-admin-production-current/00-contact-sheet.png`.
  - Fresh admin preview deployment: `https://clinicflow-admin-l62u19gjq-gunhwipak-debugs-projects.vercel.app`, Vercel Ready after `pnpm --filter @csp/admin build`.
  - Fresh admin preview screenshot attempt: `demo-evidence/route-alignment-qa/20260615T0148-admin-preview-current`, 9/9 routes returned 401 because the preview deployment is protected by Vercel authentication.
  - Caveat: web evidence is latest preview from the current dirty worktree. Admin visual evidence uses the current production alias because the fresh admin preview is protected. A single synchronized visual proof still requires either promoting admin or using a Vercel-authenticated browser session for preview screenshots.
  - After the latest screenshot evidence was added, full `git diff --check` and a targeted `git diff --check` attempt did not complete because long-running background `git maintenance/repack` processes were blocking diff work. The agent-owned diff-check processes were terminated. Prettier and Origin-14 guard still passed on the latest evidence/docs.

현재 판단:

- Node와 pnpm 자체는 즉시 응답합니다.
- `apps/web`와 `apps/admin` 타입체크 병목은 현재 해결되었습니다.
- 남은 검증 병목은 `typescript-eslint` import와 Next build 경로입니다.
- dependency engine상 Node 24가 범위 밖은 아니지만, repo에 Node LTS 고정이 없어서 Node 20/22 LTS 재검증으로 런타임 조합 문제를 먼저 배제해야 합니다.
- 따라서 UI 변경의 성공/실패가 아니라 릴리즈 검증 체계 복구 항목으로 분리합니다.
- 최신 상태에서는 typecheck와 Next dev startup이 다시 불안정합니다. 44개 route의 이전 성공 증거는 route coverage 확인에는 유효하지만, static preview runtime 경로 제거와 최신 UI 정리 후의 최종 browser QA는 Next startup 복구 뒤 다시 캡처해야 합니다.
- 최신 startup 샘플 기준으로는 UI 코드 문법 오류보다 Node 24 + Next/SWC native worker 또는 로컬 pnpm/package I/O 병목 가능성이 큽니다. 릴리즈 전에는 Node LTS 고정과 clean install 환경에서 같은 명령을 재검증해야 합니다.
- `origin14:check`는 runtime/browser 검증을 대체하지 않습니다. 이 명령은 구버전 static preview reader, 잘못된 global header, route count 이탈, Origin-14 문서 누락, 구형 시각/카피 패턴 재유입을 빠르게 막는 사전 게이트입니다.
- `release:web:fast-check`는 여전히 타입체크/Prettier까지 이어지므로, 현재 로컬 Next/TypeScript 병목이 해결되기 전에는 `origin14:check`로 UI 기준선만 빠르게 확인하고 전체 release check는 별도 릴리즈 위생 단계에서 돌립니다.

검증:

- `pnpm origin14:check`
- Node 20 또는 22 LTS로 동일 명령 재실행
- Node LTS 고정 파일 추가 여부 결정
- 검증 명령 hang 원인 분리: `typescript-eslint` package import, ESLint flat config, Next build startup, Next route collection, pnpm workspace script를 각각 단독 실행
- `pnpm exec tsx`/esbuild smoke 원인 분리
- `pnpm release:web:fast-check`
- `pnpm --filter @csp/web typecheck`
- `pnpm --filter @csp/admin typecheck`
- `pnpm --filter @csp/web build`
- `pnpm --filter @csp/admin build`
- `pnpm lint`
- 공통 shell visual QA: `SiteHeader`, `AuthScaffold`, `InfoPage`, `AdminShell`, `PaymentConfirmClient`
- Vercel preview smoke
- Supabase auth/database/storage smoke
