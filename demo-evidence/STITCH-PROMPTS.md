# Stitch Prompt Pack

Generated at: 2026-05-21T12:06:15.993Z

Use this file by copying one phase prompt or one screen prompt into Stitch/Figma-oriented generation tools. The prompts assume the screenshot files under `demo-evidence/screenshots/` are available as visual references.

## Global Prompt

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.
```

## Phase 1. Auth + Trust Entry

Intent: 첫 진입에서 신뢰감, 보안 범위, 다음 행동을 명확히 한다.

Routes: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Focus phase 1: Auth + Trust Entry
Intent: 첫 진입에서 신뢰감, 보안 범위, 다음 행동을 명확히 한다.

Use these existing screen references:
- /: desktop demo-evidence/screenshots/desktop-home.png, mobile demo-evidence/screenshots/mobile-home.png; 서비스 신뢰, 보안 경계, Flow A 시작 CTA를 첫 화면에서 빠르게 이해시키는 public entry.
- /login: desktop demo-evidence/screenshots/desktop-login.png, mobile demo-evidence/screenshots/mobile-login.png; 데모 계정과 실제 계정 모두 자연스럽게 진입하는 간결한 보안 로그인 화면.
- /signup: desktop demo-evidence/screenshots/desktop-signup.png, mobile demo-evidence/screenshots/mobile-signup.png; 동의 항목과 이메일 인증 흐름을 부담스럽지 않게 설명하는 회원가입 화면.
- /forgot-password: desktop demo-evidence/screenshots/desktop-forgot-password.png, mobile demo-evidence/screenshots/mobile-forgot-password.png; 계정 복구 요청을 짧은 폼과 보안 안내로 처리하는 화면.
- /reset-password: desktop demo-evidence/screenshots/desktop-reset-password.png, mobile demo-evidence/screenshots/mobile-reset-password.png; 토큰 기반 비밀번호 재설정과 기존 세션 무효화를 이해시키는 화면.

Design requirements:
- Keep the first viewport actionable and show a hint of the next workflow step.
- Use Korean labels for statuses and raw enums.
- Ensure mobile 390px has no overlapping badges, buttons, or long clinical text.
- Include empty, loading, and error state guidance for list/detail surfaces in this phase.
- Show trust boundaries through subtle helper text, badges, and audit/security affordances, not alarmist copy.
```

## Phase 2. Catalog + Request Start

Intent: 슈퍼바이저 탐색에서 의뢰 생성까지의 선택 피로를 줄인다.

Routes: `/supervisors`, `/supervisors/:id`, `/requests/new`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Focus phase 2: Catalog + Request Start
Intent: 슈퍼바이저 탐색에서 의뢰 생성까지의 선택 피로를 줄인다.

Use these existing screen references:
- /supervisors: desktop demo-evidence/screenshots/desktop-supervisors.png, mobile demo-evidence/screenshots/mobile-supervisors.png; 검증된 슈퍼바이저를 비교하고 필터링하는 catalog 화면.
- /supervisors/:id: desktop demo-evidence/screenshots/desktop-supervisor-detail.png, mobile demo-evidence/screenshots/mobile-supervisor-detail.png; 프로필, 자격, 상품, 가능시간을 기반으로 의뢰 시작 결정을 돕는 상세 화면.
- /requests/new: desktop demo-evidence/screenshots/desktop-request-new.png, mobile demo-evidence/screenshots/mobile-request-new.png; 보관기간, 케이스 패킷, 비식별화, 제출 확인을 단계별로 진행하는 wizard.

Design requirements:
- Keep the first viewport actionable and show a hint of the next workflow step.
- Use Korean labels for statuses and raw enums.
- Ensure mobile 390px has no overlapping badges, buttons, or long clinical text.
- Include empty, loading, and error state guidance for list/detail surfaces in this phase.
- Show trust boundaries through subtle helper text, badges, and audit/security affordances, not alarmist copy.
```

## Phase 3. Flow A Work Surfaces

Intent: 민감 자료 검토, 결제, 피드백, 완료기록 발급의 상태 전이를 선명하게 보여준다.

Routes: `/requests/:id`, `/supervisor/requests/:id`, `/payments/:id`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Focus phase 3: Flow A Work Surfaces
Intent: 민감 자료 검토, 결제, 피드백, 완료기록 발급의 상태 전이를 선명하게 보여준다.

Use these existing screen references:
- /requests/:id: desktop demo-evidence/screenshots/desktop-request-detail.png, mobile demo-evidence/screenshots/mobile-request-detail.png; 의뢰 상태, 케이스 자료, 결제, 피드백, 완료기록을 상태별로 보여주는 work surface.
- /supervisor/requests/:id: desktop demo-evidence/screenshots/desktop-supervisor-request-detail.png, mobile demo-evidence/screenshots/mobile-supervisor-request-detail.png; 민감 자료 검토, 수락/반려, 피드백, 완료기록 발급까지 이어지는 전문가 작업 화면.
- /payments/:id: desktop demo-evidence/screenshots/desktop-payment-detail.png, mobile demo-evidence/screenshots/mobile-payment-detail.png; 금액 breakdown, 결제 상태, 환불 요청을 분명하게 분리한 영수증 상세.

Design requirements:
- Keep the first viewport actionable and show a hint of the next workflow step.
- Use Korean labels for statuses and raw enums.
- Ensure mobile 390px has no overlapping badges, buttons, or long clinical text.
- Include empty, loading, and error state guidance for list/detail surfaces in this phase.
- Show trust boundaries through subtle helper text, badges, and audit/security affordances, not alarmist copy.
```

## Phase 4. Ops Consoles

Intent: 운영자가 큐와 리스크를 빠르게 스캔할 수 있게 한다.

Routes: `/supervisor`, `/admin`, `/admin/qualifications`, `/admin/refunds`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Focus phase 4: Ops Consoles
Intent: 운영자가 큐와 리스크를 빠르게 스캔할 수 있게 한다.

Use these existing screen references:
- /supervisor: desktop demo-evidence/screenshots/desktop-supervisor-dashboard.png, mobile demo-evidence/screenshots/mobile-supervisor-dashboard.png; 슈퍼바이저가 새 의뢰, 검토 중, 완료 상태를 보는 업무 dashboard.
- /admin: desktop demo-evidence/screenshots/desktop-admin-dashboard.png, mobile demo-evidence/screenshots/mobile-admin-dashboard.png; 운영자가 승인, 환불, 감사 리스크를 카운트 카드로 파악하는 dashboard.
- /admin/qualifications: desktop demo-evidence/screenshots/desktop-admin-qualifications.png, mobile demo-evidence/screenshots/mobile-admin-qualifications.png; 자격 승인 큐와 30자 이상 reason 입력을 강조하는 운영 화면.
- /admin/refunds: desktop demo-evidence/screenshots/desktop-admin-refunds.png, mobile demo-evidence/screenshots/mobile-admin-refunds.png; 환불 요청 큐를 처리 전 검토 상태로 보여주는 stub 화면.

Design requirements:
- Keep the first viewport actionable and show a hint of the next workflow step.
- Use Korean labels for statuses and raw enums.
- Ensure mobile 390px has no overlapping badges, buttons, or long clinical text.
- Include empty, loading, and error state guidance for list/detail surfaces in this phase.
- Show trust boundaries through subtle helper text, badges, and audit/security affordances, not alarmist copy.
```

## Screen-Level Prompts

### Public /

- Desktop: `demo-evidence/screenshots/desktop-home.png`
- Mobile: `demo-evidence/screenshots/mobile-home.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /
Area: Public
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-home.png
- Mobile screenshot: demo-evidence/screenshots/mobile-home.png

Screen job:
서비스 신뢰, 보안 경계, Flow A 시작 CTA를 첫 화면에서 빠르게 이해시키는 public entry.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Auth /login

- Desktop: `demo-evidence/screenshots/desktop-login.png`
- Mobile: `demo-evidence/screenshots/mobile-login.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /login
Area: Auth
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-login.png
- Mobile screenshot: demo-evidence/screenshots/mobile-login.png

Screen job:
데모 계정과 실제 계정 모두 자연스럽게 진입하는 간결한 보안 로그인 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Auth /signup

- Desktop: `demo-evidence/screenshots/desktop-signup.png`
- Mobile: `demo-evidence/screenshots/mobile-signup.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /signup
Area: Auth
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-signup.png
- Mobile screenshot: demo-evidence/screenshots/mobile-signup.png

Screen job:
동의 항목과 이메일 인증 흐름을 부담스럽지 않게 설명하는 회원가입 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Auth /verify-email

- Desktop: `demo-evidence/screenshots/desktop-verify-email.png`
- Mobile: `demo-evidence/screenshots/mobile-verify-email.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /verify-email
Area: Auth
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-verify-email.png
- Mobile screenshot: demo-evidence/screenshots/mobile-verify-email.png

Screen job:
메일 인증이 필요한 상태를 조용하고 명확하게 안내하는 대기 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Auth /forgot-password

- Desktop: `demo-evidence/screenshots/desktop-forgot-password.png`
- Mobile: `demo-evidence/screenshots/mobile-forgot-password.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /forgot-password
Area: Auth
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-forgot-password.png
- Mobile screenshot: demo-evidence/screenshots/mobile-forgot-password.png

Screen job:
계정 복구 요청을 짧은 폼과 보안 안내로 처리하는 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Auth /reset-password

- Desktop: `demo-evidence/screenshots/desktop-reset-password.png`
- Mobile: `demo-evidence/screenshots/mobile-reset-password.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /reset-password
Area: Auth
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-reset-password.png
- Mobile screenshot: demo-evidence/screenshots/mobile-reset-password.png

Screen job:
토큰 기반 비밀번호 재설정과 기존 세션 무효화를 이해시키는 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Catalog /supervisors

- Desktop: `demo-evidence/screenshots/desktop-supervisors.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisors.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisors
Area: Catalog
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisors.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisors.png

Screen job:
검증된 슈퍼바이저를 비교하고 필터링하는 catalog 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Catalog /supervisors/:id

- Desktop: `demo-evidence/screenshots/desktop-supervisor-detail.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-detail.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisors/:id
Area: Catalog
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-detail.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-detail.png

Screen job:
프로필, 자격, 상품, 가능시간을 기반으로 의뢰 시작 결정을 돕는 상세 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisee /requests

- Desktop: `demo-evidence/screenshots/desktop-requests.png`
- Mobile: `demo-evidence/screenshots/mobile-requests.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /requests
Area: Supervisee
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-requests.png
- Mobile screenshot: demo-evidence/screenshots/mobile-requests.png

Screen job:
슈퍼바이지가 자신의 의뢰 상태를 빠르게 스캔하는 목록 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisee /requests/new

- Desktop: `demo-evidence/screenshots/desktop-request-new.png`
- Mobile: `demo-evidence/screenshots/mobile-request-new.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /requests/new
Area: Supervisee
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-request-new.png
- Mobile screenshot: demo-evidence/screenshots/mobile-request-new.png

Screen job:
보관기간, 케이스 패킷, 비식별화, 제출 확인을 단계별로 진행하는 wizard.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisee /requests/:id

- Desktop: `demo-evidence/screenshots/desktop-request-detail.png`
- Mobile: `demo-evidence/screenshots/mobile-request-detail.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /requests/:id
Area: Supervisee
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-request-detail.png
- Mobile screenshot: demo-evidence/screenshots/mobile-request-detail.png

Screen job:
의뢰 상태, 케이스 자료, 결제, 피드백, 완료기록을 상태별로 보여주는 work surface.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisee /payments

- Desktop: `demo-evidence/screenshots/desktop-payments.png`
- Mobile: `demo-evidence/screenshots/mobile-payments.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /payments
Area: Supervisee
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-payments.png
- Mobile screenshot: demo-evidence/screenshots/mobile-payments.png

Screen job:
결제 내역을 영수증 보관함처럼 스캔하는 목록 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisee /payments/:id

- Desktop: `demo-evidence/screenshots/desktop-payment-detail.png`
- Mobile: `demo-evidence/screenshots/mobile-payment-detail.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /payments/:id
Area: Supervisee
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-payment-detail.png
- Mobile screenshot: demo-evidence/screenshots/mobile-payment-detail.png

Screen job:
금액 breakdown, 결제 상태, 환불 요청을 분명하게 분리한 영수증 상세.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisee /settings

- Desktop: `demo-evidence/screenshots/desktop-settings.png`
- Mobile: `demo-evidence/screenshots/mobile-settings.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /settings
Area: Supervisee
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-settings.png
- Mobile screenshot: demo-evidence/screenshots/mobile-settings.png

Screen job:
계정 보안, 세션, 비밀번호, TOTP 상태를 확인하는 설정 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor

- Desktop: `demo-evidence/screenshots/desktop-supervisor-dashboard.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-dashboard.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-dashboard.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-dashboard.png

Screen job:
슈퍼바이저가 새 의뢰, 검토 중, 완료 상태를 보는 업무 dashboard.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor/requests

- Desktop: `demo-evidence/screenshots/desktop-supervisor-requests.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-requests.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor/requests
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-requests.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-requests.png

Screen job:
슈퍼바이저 의뢰 큐를 상태와 다음 행동 중심으로 스캔하는 목록.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor/requests/:id

- Desktop: `demo-evidence/screenshots/desktop-supervisor-request-detail.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-request-detail.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor/requests/:id
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-request-detail.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-request-detail.png

Screen job:
민감 자료 검토, 수락/반려, 피드백, 완료기록 발급까지 이어지는 전문가 작업 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor/profile

- Desktop: `demo-evidence/screenshots/desktop-supervisor-profile.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-profile.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor/profile
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-profile.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-profile.png

Screen job:
공개 프로필과 검증 상태를 정리하는 supervisor profile 관리 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor/qualifications

- Desktop: `demo-evidence/screenshots/desktop-supervisor-qualifications.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-qualifications.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor/qualifications
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-qualifications.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-qualifications.png

Screen job:
자격 추가와 승인 대기 상태를 명확히 보여주는 자격 관리 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor/products

- Desktop: `demo-evidence/screenshots/desktop-supervisor-products.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-products.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor/products
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-products.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-products.png

Screen job:
서비스 상품 가격과 활성 상태를 관리하는 상품 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Supervisor /supervisor/availability

- Desktop: `demo-evidence/screenshots/desktop-supervisor-availability.png`
- Mobile: `demo-evidence/screenshots/mobile-supervisor-availability.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /supervisor/availability
Area: Supervisor
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-supervisor-availability.png
- Mobile screenshot: demo-evidence/screenshots/mobile-supervisor-availability.png

Screen job:
가능 시간 슬롯을 요일/시간 중심으로 정리하는 availability 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Admin /admin

- Desktop: `demo-evidence/screenshots/desktop-admin-dashboard.png`
- Mobile: `demo-evidence/screenshots/mobile-admin-dashboard.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /admin
Area: Admin
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-admin-dashboard.png
- Mobile screenshot: demo-evidence/screenshots/mobile-admin-dashboard.png

Screen job:
운영자가 승인, 환불, 감사 리스크를 카운트 카드로 파악하는 dashboard.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Admin /admin/qualifications

- Desktop: `demo-evidence/screenshots/desktop-admin-qualifications.png`
- Mobile: `demo-evidence/screenshots/mobile-admin-qualifications.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /admin/qualifications
Area: Admin
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-admin-qualifications.png
- Mobile screenshot: demo-evidence/screenshots/mobile-admin-qualifications.png

Screen job:
자격 승인 큐와 30자 이상 reason 입력을 강조하는 운영 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Admin /admin/refunds

- Desktop: `demo-evidence/screenshots/desktop-admin-refunds.png`
- Mobile: `demo-evidence/screenshots/mobile-admin-refunds.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /admin/refunds
Area: Admin
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-admin-refunds.png
- Mobile screenshot: demo-evidence/screenshots/mobile-admin-refunds.png

Screen job:
환불 요청 큐를 처리 전 검토 상태로 보여주는 stub 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```

### Admin /admin/payouts

- Desktop: `demo-evidence/screenshots/desktop-admin-payouts.png`
- Mobile: `demo-evidence/screenshots/mobile-admin-payouts.png`

```text
You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.
Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.
Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.
Use these semantic tokens: brand #3B82F6/#2563EB/#0F172A, accent #E0F2FE/#38BDF8, surface #F8FAFC/#FFFFFF/#EEF4FF, ink #0F172A/#334155/#64748B, line #E2E8F0.
Radius scale: sm 8px, md 12px, lg 16px, xl 20px. Font: Pretendard Variable, system-ui, sans-serif.
Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.
Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns.

Redesign one screen: /admin/payouts
Area: Admin
Current evidence:
- Desktop screenshot: demo-evidence/screenshots/desktop-admin-payouts.png
- Mobile screenshot: demo-evidence/screenshots/mobile-admin-payouts.png

Screen job:
정산 기간과 예정 금액을 확인하는 운영 정산 화면.

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.
```
