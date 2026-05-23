# Interaction Audit Confirmation Request

수정은 아직 하지 않았습니다. 아래는 5개 관점 감사 중 현재 도착한 결과와 메인 플로우 직접 클릭 결과를 합친 수정 후보입니다.

## Evidence

- Main flow: `demo-evidence/interaction-audit/main-flow/main-flow.json`
- Supervisor audit: `demo-evidence/interaction-audit/agent-c-supervisor/REPORT.md`
- Supervisee audit: `demo-evidence/interaction-audit/agent-b-supervisee-flow/AUDIT.md`
- Admin audit: `demo-evidence/interaction-audit/agent-d-admin/REPORT.md`
- Mobile audit: `demo-evidence/interaction-audit/agent-e-mobile/REPORT.md`
- Control inventory: `demo-evidence/interaction-audit/control-inventory.json`

## Proposed Fix Set A: routing and click wiring only

1. Fix `/supervisors` vs `/supervisor` prefix detection.
   - Current issue: `/supervisors` can be mistaken for supervisor console in navigation decisions.
   - Impact: public `My Requests` can route to `/supervisor/requests` incorrectly.

2. Connect visible supervisor dashboard/queue CTAs.
   - `/supervisor` availability/schedule button should go to `/supervisor/availability`.
   - `/supervisor/requests` visible review/start buttons should go to `/supervisor/requests/<demo-id>`.

3. Improve mobile CTA mapping.
   - Home mobile menu toggle.
   - `/supervisors` mobile profile CTA.
   - Supervisor detail mobile request CTA.
   - `/requests/new` mobile wizard next/submit.

4. Payment click feedback.
   - After payment API success, navigate to `/payments` or refresh state so the user sees something happened.
   - `/payments` receipt buttons: print or detail route where possible.

## Proposed Fix Set B: small display safeguards

5. `/settings` role confusion.
   - Supervisee currently sees supervisor-flavored settings copy.
   - Narrow fix: add role-aware visual message or route CTA, without touching auth/session logic.

6. Admin static dashboard cleanup.
   - Wire admin nav to `/admin/qualifications`, `/admin/refunds`, `/admin/payouts`.
   - Mark non-implemented buttons as disabled/static rather than silently clickable.
   - Replace obvious supervisor-context wording on admin dashboard only if it can be done without backend changes.

## Screenshots to review

- `demo-evidence/interaction-audit/agent-b-supervisee-flow/05-supervisors-search-enter.png`
- `demo-evidence/interaction-audit/agent-b-supervisee-flow/focus-payment-after.png`
- `demo-evidence/interaction-audit/agent-b-supervisee-flow/15-settings-page.png`
- `demo-evidence/interaction-audit/agent-c-supervisor/28-visible-availability-nav.png`
- `demo-evidence/interaction-audit/agent-c-supervisor/29-visible-request-detail-click.png`
- `demo-evidence/interaction-audit/agent-d-admin/10-dashboard.png`
- `demo-evidence/interaction-audit/agent-e-mobile/28-home-mobile-final.png`
- `demo-evidence/interaction-audit/agent-e-mobile/35-supervisors-mobile-final.png`
- `demo-evidence/interaction-audit/agent-e-mobile/41-new-request-mobile-step1-final.png`
- `demo-evidence/interaction-audit/agent-e-mobile/53-supervisor-requests-after-cta-final.png`

## Confirmation Needed

컨펌하면 Fix Set A + B를 모두 진행하겠습니다. 백엔드/API/DB/RLS/PHI/auth는 변경하지 않고, `stitch-interactivity.tsx` 중심의 UI interaction layer와 필요한 최소 표시 조정만 합니다.
