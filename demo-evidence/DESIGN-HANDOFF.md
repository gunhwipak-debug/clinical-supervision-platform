# Design Handoff

Generated at: 2026-05-21T12:06:15.596Z

This packet is the bridge from the local demo UI to Stitch/Figma redesign work. It keeps code tokens, screenshot evidence, and route priorities in one place so a designer or another agent can start without re-scanning the repo.

## Source Of Truth

- Tokens: `packages/design-tokens/src/tokens.ts`
- Tailwind theme export: `packages/design-tokens/src/tokens.css`
- Screenshot catalog: `demo-evidence/SCREENS.md`
- Figma setup: `docs/decisions/DESIGN-FIGMA.md`
- Machine-readable handoff: `demo-evidence/DESIGN-HANDOFF.json`

## Redesign Priorities

### 1. Auth + Trust Entry

- Intent: 첫 진입에서 신뢰감, 보안 범위, 다음 행동을 명확히 한다.
- Routes: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`

### 2. Catalog + Request Start

- Intent: 슈퍼바이저 탐색에서 의뢰 생성까지의 선택 피로를 줄인다.
- Routes: `/supervisors`, `/supervisors/:id`, `/requests/new`

### 3. Flow A Work Surfaces

- Intent: 민감 자료 검토, 결제, 피드백, 완료기록 발급의 상태 전이를 선명하게 보여준다.
- Routes: `/requests/:id`, `/supervisor/requests/:id`, `/payments/:id`

### 4. Ops Consoles

- Intent: 운영자가 큐와 리스크를 빠르게 스캔할 수 있게 한다.
- Routes: `/supervisor`, `/admin`, `/admin/qualifications`, `/admin/refunds`

## Token Summary

- Brand: #3B82F6 / #2563EB / #0F172A
- Accent: #E0F2FE / #38BDF8 / #0284C7
- Surfaces: #F8FAFC, #FFFFFF, #EEF4FF
- Radius: sm 8px, md 12px, lg 16px, xl 20px
- Font: Pretendard Variable, system-ui, sans-serif

## Screen Evidence

| Area       | Route                        | Desktop                                 | Mobile                                 | Status |
| ---------- | ---------------------------- | --------------------------------------- | -------------------------------------- | ------ |
| Public     | `/`                          | `desktop-home.png`                      | `mobile-home.png`                      | OK     |
| Auth       | `/login`                     | `desktop-login.png`                     | `mobile-login.png`                     | OK     |
| Auth       | `/signup`                    | `desktop-signup.png`                    | `mobile-signup.png`                    | OK     |
| Auth       | `/verify-email`              | `desktop-verify-email.png`              | `mobile-verify-email.png`              | OK     |
| Auth       | `/forgot-password`           | `desktop-forgot-password.png`           | `mobile-forgot-password.png`           | OK     |
| Auth       | `/reset-password`            | `desktop-reset-password.png`            | `mobile-reset-password.png`            | OK     |
| Catalog    | `/supervisors`               | `desktop-supervisors.png`               | `mobile-supervisors.png`               | OK     |
| Catalog    | `/supervisors/:id`           | `desktop-supervisor-detail.png`         | `mobile-supervisor-detail.png`         | OK     |
| Supervisee | `/requests`                  | `desktop-requests.png`                  | `mobile-requests.png`                  | OK     |
| Supervisee | `/requests/new`              | `desktop-request-new.png`               | `mobile-request-new.png`               | OK     |
| Supervisee | `/requests/:id`              | `desktop-request-detail.png`            | `mobile-request-detail.png`            | OK     |
| Supervisee | `/payments`                  | `desktop-payments.png`                  | `mobile-payments.png`                  | OK     |
| Supervisee | `/payments/:id`              | `desktop-payment-detail.png`            | `mobile-payment-detail.png`            | OK     |
| Supervisee | `/settings`                  | `desktop-settings.png`                  | `mobile-settings.png`                  | OK     |
| Supervisor | `/supervisor`                | `desktop-supervisor-dashboard.png`      | `mobile-supervisor-dashboard.png`      | OK     |
| Supervisor | `/supervisor/requests`       | `desktop-supervisor-requests.png`       | `mobile-supervisor-requests.png`       | OK     |
| Supervisor | `/supervisor/requests/:id`   | `desktop-supervisor-request-detail.png` | `mobile-supervisor-request-detail.png` | OK     |
| Supervisor | `/supervisor/profile`        | `desktop-supervisor-profile.png`        | `mobile-supervisor-profile.png`        | OK     |
| Supervisor | `/supervisor/qualifications` | `desktop-supervisor-qualifications.png` | `mobile-supervisor-qualifications.png` | OK     |
| Supervisor | `/supervisor/products`       | `desktop-supervisor-products.png`       | `mobile-supervisor-products.png`       | OK     |
| Supervisor | `/supervisor/availability`   | `desktop-supervisor-availability.png`   | `mobile-supervisor-availability.png`   | OK     |
| Admin      | `/admin`                     | `desktop-admin-dashboard.png`           | `mobile-admin-dashboard.png`           | OK     |
| Admin      | `/admin/qualifications`      | `desktop-admin-qualifications.png`      | `mobile-admin-qualifications.png`      | OK     |
| Admin      | `/admin/refunds`             | `desktop-admin-refunds.png`             | `mobile-admin-refunds.png`             | OK     |
| Admin      | `/admin/payouts`             | `desktop-admin-payouts.png`             | `mobile-admin-payouts.png`             | OK     |

## Notes For Stitch/Figma

- Keep the security boundaries visible: PHI access is purpose-limited, admin reasons are audited, and public search never exposes encrypted clinical content.
- Prefer real workflow surfaces over marketing-only layouts. The first viewport should still expose the next action.
- Preserve token names when translating to Figma variables: `brand-600`, `surface-base`, `ink-700`, `line`, `radius-lg`.
- If using an HTML-to-design capture tool, remove any temporary capture script after use; do not leave remote capture scripts in the app source.

All referenced screenshots exist.
