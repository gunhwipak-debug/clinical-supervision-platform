# ClinicFlow Desktop-only Post-refactor Visual QA

Date: 2026-06-15

## Scope 기준

- ClinicFlow는 현재 desktop-first / desktop-operated clinical workflow web app이다.
- Mobile optimization is out of scope for the current UI/UX architecture refactor.
- Desktop QA is authoritative.
- Mobile behavior is best-effort only and not a release blocker.
- Do not introduce mobile-first navigation patterns that weaken desktop workflow clarity.
- Primary QA viewport: 1440x1000.
- Mobile screenshots were intentionally not captured.

## 1. Visual QA verdict

**GO WITH CAUTION: 2차 UI/UX refactor 진행 가능하지만 시각/구조 이슈 있음.**

근거:

- Public, supervisee, supervisor, admin 대표 route는 1440x1000 desktop에서 실제 캡처 가능했다.
- Origin-14 guard와 web/admin typecheck는 통과했다.
- 로그인 후 desktop role navigation은 세 역할 모두 보인다.
- `/supervisors` row/list 전환은 기존 card grid보다 명확해졌다.
- 다만 request detail이 완료 상태에서 `학습 기록` 중심으로 과도하게 길어지고, 7단계 신청 흐름과 현재 `/requests/new`의 5단계 UI가 아직 완전히 맞지 않는다.
- role navigation label이 사용자가 지정한 기대값과 일부 다르다.
- admin/refunds/payouts/audit 및 supervisor request list에는 아직 card-heavy/mixed layout 잔재가 있다.

## 2. Desktop screenshot evidence

Contact sheet:

- `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/desktop-contact-sheet.jpg`

| route | role | screenshot path | result |
|---|---|---|---|
| `/` | public | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/public-home.png` | captured |
| `/supervisors` | public | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/public-supervisors.png` | captured |
| `/guide` | public | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/public-guide.png` | captured |
| `/requests` | supervisee | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisee-requests.png` | captured |
| `/requests/new` | supervisee | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisee-requests-new.png` | captured |
| `/requests/[id]` | supervisee | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisee-requests-detail.png` | captured |
| `/payments` | supervisee | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisee-payments.png` | captured |
| `/case-archive` | supervisee | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisee-case-archive.png` | captured |
| `/settings` | supervisee | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisee-settings.png` | captured |
| `/supervisor` | supervisor | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisor-supervisor.png` | captured |
| `/supervisor/requests` | supervisor | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisor-supervisor-requests.png` | captured |
| `/supervisor/profile` | supervisor | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisor-supervisor-profile.png` | captured |
| `/supervisor/products` | supervisor | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisor-supervisor-products.png` | captured |
| `/supervisor/availability` | supervisor | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisor-supervisor-availability.png` | captured |
| `/supervisor/payouts` | supervisor | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/supervisor-supervisor-payouts.png` | captured |
| `/supervisor/qualifications` | supervisor | not generated | not captured; dev server timed out after build/lint checks |
| `/admin` | admin | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/admin-admin.png` | captured |
| `/admin/queue` | admin | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/admin-admin-queue.png` | captured |
| `/admin/qualifications` | admin | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/admin-admin-qualifications.png` | captured |
| `/admin/refunds` | admin | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/admin-admin-refunds.png` | captured |
| `/admin/payouts` | admin | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/admin-admin-payouts.png` | captured |
| `/admin/audit` | admin | `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/admin-admin-audit.png` | captured |

Raw capture metrics:

- `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/desktop-qa-results.json`
- `demo-evidence/uiux-refactor-pass1-visual-qa/2026-06-15/request-detail-metrics.json`

## 3. Role navigation QA

### Supervisee

Expected:

- 내 의뢰
- 슈퍼바이저 찾기
- 결제 내역
- 케이스 아카이브
- 알림
- 설정

Observed visible desktop nav:

- 내 의뢰
- 새 의뢰
- 결제 내역
- 학습 기록
- 알림
- 슈퍼바이저 찾기
- 이용 가이드
- 계정 설정

Verdict: **partial**

- Persistent desktop role nav is visible.
- Active state works on `/requests`.
- Account/logout is reachable from the account menu.
- Label mismatch: `케이스 아카이브` is shown as `학습 기록`, and `설정` is shown as `계정 설정`.
- Extra items `새 의뢰`, `이용 가이드` may be acceptable, but they should be reviewed against the final IA.

### Supervisor

Expected:

- 업무 홈
- 검토할 의뢰
- 프로필
- 슈퍼비전 방식
- 가능 시간
- 기록 폴더
- 정산 내역
- 자격 정보

Observed visible desktop nav:

- 업무 홈
- 검토할 의뢰
- 기록 폴더
- 프로필
- 슈퍼비전 방식
- 일정 관리
- 정산 내역
- 자격 심사

Verdict: **partial**

- Persistent desktop role nav is visible.
- Active state works on `/supervisor`.
- Account/logout is reachable from the account menu.
- Label mismatch: `가능 시간` is shown as `일정 관리`, and `자격 정보` is shown as `자격 심사`.

### Admin

Expected:

- 관리자 홈
- 대기열
- 자격 심사
- 환불
- 정산
- 감사 로그

Observed visible desktop nav:

- 운영 처리 목록
- 운영 대기열
- 자격 심사
- 환불 검토
- 정산 확인
- 처리 기록

Verdict: **partial**

- Admin desktop nav is visible.
- Active state works on `/admin/queue`.
- Account/logout is reachable from the account menu.
- Label mismatch: current labels are more process-specific than the requested concise IA labels.
- Admin top nav and account menu both repeat operational links; not confusing enough to block QA, but should be simplified in 2차 pass.

## 4. Desktop route-level UX checklist

| route | role | desktop verdict | main issue | next recommended fix |
|---|---|---|---|---|
| `/` | public | pass | Home is coherent, but bottom content still feels lighter than a full sales page. | Add one concise value/proof section only if it follows Origin-14, no metrics filler. |
| `/supervisors` | public | pass | Row/list structure works; rows are slightly table-like. | Keep structure; minor visual polish only. |
| `/guide` | public | partial | Flow is clear, but explanatory cards remain relatively dense. | Keep flow; reduce card emphasis if 2차 pass touches guide. |
| `/requests` | supervisee | pass | Clear next-action panel and request rows. | Align nav label `학습 기록`/`케이스 아카이브` decision. |
| `/requests/new` | supervisee | partial | UI shows 5-step flow, not requested 7-step flow; save/next semantics are not fully explicit. | Rework step/task model to 7-step sequence. |
| `/requests/[id]` | supervisee | fail | Completed request opens with H1 `학습 기록`; page is a long stack of panels and not request status/detail first. | Split status/detail/next action, then place learning record as status-specific section. |
| `/payments` | supervisee | pass | Good list/table direction. | Minor copy polish only. |
| `/case-archive` | supervisee | partial | Folder-like structure exists, but label contract conflicts with expected `케이스 아카이브`. | Decide final Korean label and align nav/H1. |
| `/settings` | supervisee | pass | Form is clear. | No immediate UI fix. |
| `/supervisor` | supervisor | pass | Queue-first structure is visible. | Keep; avoid adding number cards. |
| `/supervisor/requests` | supervisor | partial | Several repeated panels still feel mixed/card-heavy. | Convert remaining items to stricter review queue rows. |
| `/supervisor/profile` | supervisor | pass | Form and preview are readable. | Minor loading/error copy review. |
| `/supervisor/products` | supervisor | partial | Empty/setup state is clear but still panel-heavy. | Use tighter line-list setup rows if touched. |
| `/supervisor/availability` | supervisor | partial | Calendar area is functional but dense. | Keep desktop-first; improve line-by-line save/status grouping. |
| `/supervisor/payouts` | supervisor | partial | Summary side panel is useful; payout rows can be tighter. | Convert to clearer payout table/list. |
| `/admin` | admin | pass | List-first enough. | Align nav label to `관리자 홈` if final IA requires it. |
| `/admin/queue` | admin | pass | Queue list is clear. | No immediate UI fix. |
| `/admin/qualifications` | admin | partial | Review criteria panel is useful, but layout still has card feel. | Keep dark side panel; tighten review rows. |
| `/admin/refunds` | admin | partial | Still feels like operational cards. | Convert refund items to row/table list. |
| `/admin/payouts` | admin | partial | Has summary cards and side panel; more dashboard-like than list-first. | Convert to payment/payout list with compact side summary. |
| `/admin/audit` | admin | partial | Audit content is broken into cards; scannability is okay but not dense enough. | Convert to audit log table/list. |

## 5. 남은 card-heavy / AI-like UI 후보

Priority order for 2차 pass:

| route | current layout | severity | recommended 2차 fix |
|---|---|---|---|
| `/requests/[id]` | mixed / long card stack | high | Status/detail-first page with one primary action and fixed summary panel. |
| `/supervisor/requests` | mixed review cards | medium | Queue rows with status, due signal, and single action. |
| `/admin/payouts` | mixed cards / side panel | medium | Payout table/list and one compact summary. |
| `/admin/refunds` | mixed cards | medium | Refund review rows with decision status. |
| `/admin/audit` | card-heavy log grouping | medium | Dense audit list/table. |
| `/supervisor/products` | setup panels | medium | Line-list setup rows; keep one action. |
| `/supervisor/payouts` | mixed | medium | Compact payout rows. |
| `/case-archive` | folder/list mixed | low | Keep folder model; align naming. |
| `/payments` | list/table | low | Keep. |
| `/requests` | task-list | low | Keep. |

## 6. Request flow gap

Requested 7-step flow:

1. 슈퍼바이저 선택
2. 상품 선택
3. 일정 선택
4. 사례 자료 작성
5. 답변 확인
6. 결제
7. 수락 대기

Observed:

- `/requests/new` currently presents a 5-step flow: `슈퍼바이저 선택`, `세션·일정`, `사례자료 정리`, `확인·결제`, `학습 기록`.
- `/requests/new` does not look like a generic checkout wizard, which is good.
- However, `상품 선택` and `일정 선택` are combined under `세션·일정`, and `답변 확인`, `결제`, `수락 대기` are not separately represented.
- Primary CTA currently emphasizes `슈퍼바이저 찾기`; a dedicated `신청 초안 저장` action is not obvious in the captured state.
- `/requests/[id]` for completed demo data opens as `학습 기록`, not a neutral request detail/status page. This makes completed state understandable, but weakens route identity and request-detail architecture.
- Save action and next action need stronger separation in 2차 pass.

## 7. 2차 패스 권장 범위

Minimum implementation scope:

1. Align role nav labels to final expected IA.
2. Refactor `/requests/new` step/task model to the 7-step sequence without mobile work.
3. Refactor `/requests/[id]` to status/detail/next-action first, then conditional learning-record content.
4. Convert `/supervisor/requests` remaining review cards to queue rows.
5. Convert `/admin/refunds`, `/admin/payouts`, `/admin/audit` to denser operational list/table layouts.
6. Align `/case-archive` naming against `케이스 아카이브` vs `학습 기록`.
7. Keep desktop persistent role navigation as the QA target; do not spend time on bottom nav, hamburger, or 390px polish.

## 8. 검증 결과

| command | result | notes |
|---|---|---|
| `pnpm origin14:check` | pass | 36/36 checks passed. |
| `pnpm --filter @csp/web typecheck` | pass | `tsc --noEmit` exited 0. |
| `pnpm --filter @csp/admin typecheck` | pass | `tsc --noEmit` exited 0. |
| `pnpm --filter @csp/web build` | timeout | 120초 무출력 timeout. Release hygiene blocker로 분리. |
| `pnpm --filter @csp/admin build` | timeout | 120초 무출력 timeout. Release hygiene blocker로 분리. |
| `pnpm lint` | timeout | 120초 무출력 timeout. Release hygiene blocker로 분리. |

After the build/lint timeout checks, local dev servers still held ports 3000/3001 but stopped returning HTTP responses within 10 seconds. Shutdown logs showed `ENOENT: no such file or directory, open 'apps/web/.next/routes-manifest.json'` and the same missing `apps/admin/.next/routes-manifest.json` pattern. This should be treated as part of the existing Next/Node release hygiene blocker, not as mobile or UI scope.

## 9. 주의사항

- This QA was desktop-first only.
- Mobile optimization, mobile navigation polish, bottom nav, hamburger UX, and 390px screenshot QA are out of scope.
- Existing dirty app code was treated as baseline. This QA did not revert or refactor app implementation files.
- Build/lint timeout remains a Release hygiene blocker.
- Hardcoded admin URL risk remains: fallback admin origin still references `https://clinicflow-admin-six.vercel.app` in auth/admin locked-state code paths.
- Legacy Netlify references remain in historical/docs/scripts areas and should not be treated as current deployment instruction unless explicitly reactivated.
- Ambiguous/legacy routes still require explicit handling in the next implementation plan: `/me`, `/verify-email`, `/sensitive-consent`, admin `/payouts`, admin `/refunds`.
