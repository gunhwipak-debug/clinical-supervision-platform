# Agent E Mobile Interaction Audit

- 대상: `http://localhost:3000`
- Viewport: `390x844`, mobile/touch emulation
- 범위: mobile menu, auth forms, supervisors, new request wizard, payments/settings, supervisor mobile screens
- 원칙: 코드/설정 변경 없음. 캡처와 노트만 생성.
- Raw data: `audit-raw.json`

## 요약

모바일 화면은 렌더링 자체는 대부분 정상이나, 실제 사용 관점에서는 핵심 흐름에서 막히는 지점이 있습니다.

- P1: 5건
- P2: 7건
- 생성 스크린샷: 56개

최종 수정 전 컨펌이 필요한 우선순위는 다음 4개입니다.

1. 홈 모바일 메뉴 열기
2. 슈퍼바이저 목록 카드 CTA 연결
3. 새 의뢰 모바일 위저드 단계 진행/제출
4. 슈퍼바이저 요청 큐 상세 진입 CTA

## Findings

### E-01. 홈 모바일 메뉴 아이콘이 열리지 않음

- Severity: P1
- Area: Mobile menu
- Repro: `/` 접속 → 우상단 `menu` 아이콘 탭
- Expected: 모바일 내비게이션 또는 메뉴 패널이 열림
- Actual: URL/DOM text 변화 없음
- Evidence:
  - `28-home-mobile-final.png`
  - `29-home-after-menu-final.png`

### E-02. 슈퍼바이저 목록의 전문분야 chip이 모바일 폭 밖으로 넘침

- Severity: P2
- Area: Supervisors responsive
- Repro: `/supervisors` 390px 폭에서 카드 상단 chip row 확인
- Expected: chip row가 스크롤 가능하거나 줄바꿈/클리핑이 의도적으로 처리됨
- Actual: `아동/청소년`, `가족상담` chip이 viewport 오른쪽 밖으로 밀림
- Evidence:
  - `35-supervisors-mobile-final.png`
- Raw note:
  - `아동/청소년`: right `414`
  - `가족상담`: right `497`

### E-03. 슈퍼바이저 목록 필터/메뉴성 CTA가 열리지 않음

- Severity: P2
- Area: Supervisors mobile
- Repro: `/supervisors` 접속 → 필터 아이콘/`Filter`/`Tune` 계열 CTA 탭
- Expected: 모바일 필터 시트 또는 필터 UI가 열림
- Actual: URL/DOM text 변화 없음. `필터`, `Filter` 텍스트 버튼은 없음.
- Evidence:
  - `35-supervisors-mobile-final.png`
  - `36-supervisors-after-filter-final.png`

### E-04. 슈퍼바이저 목록 `프로필 보기` CTA가 상세로 이동하지 않음

- Severity: P1
- Area: Supervisors
- Repro: `/supervisors` 접속 → 첫 카드 `프로필 보기` 탭
- Expected: `/supervisors/[id]` 상세로 이동
- Actual: `http://localhost:3000/supervisors`에 그대로 머무름
- Evidence:
  - `37-supervisor-profile-from-list-final.png`

### E-05. 슈퍼바이저 상세/목록에서 새 의뢰 CTA 진입이 불가능함

- Severity: P1
- Area: Supervisor profile
- Repro: `/supervisors/[id]` 또는 목록 CTA 이후 → 의뢰 관련 CTA 탭
- Expected: `/requests/new?serviceProductId=...`로 이동
- Actual: 의뢰 텍스트 클릭 대상을 찾지 못하거나 `/supervisors`에 그대로 머무름
- Evidence:
  - `38-supervisor-profile-request-final.png`

### E-06. 새 의뢰 모바일 위저드 `다음` 버튼이 단계를 진행시키지 않음

- Severity: P1
- Area: New request wizard
- Repro: 로그인 후 `/requests/new?serviceProductId=10000000-0000-4000-8000-000000000301` → `다음` 버튼 반복 탭
- Expected: Step 1 → Step 2 → Step 3 진행
- Actual: DOM text 변화 없음. 화면이 Step 1에 머무름
- Evidence:
  - `41-new-request-mobile-step1-final.png`
  - `42-new-request-after-next-1-final.png`
  - `43-new-request-after-next-2-final.png`
  - `44-new-request-after-next-3-final.png`

### E-07. 새 의뢰 모바일 위저드 `제출` 버튼이 의뢰 생성/상세 이동을 완료하지 못함

- Severity: P1
- Area: New request wizard
- Repro: 로그인 후 `/requests/new?...` → `다음` 반복 → `제출`
- Expected: 의뢰 생성 후 `/requests/[id]` 상세로 이동
- Actual: URL이 `/requests/new?serviceProductId=...`에 그대로 머무름
- Evidence:
  - `45-new-request-submit-final.png`

### E-08. 슈퍼바이저 요청 큐에서 상세 진입 CTA를 찾기 어려움

- Severity: P2
- Area: Supervisor requests
- Repro: 슈퍼바이저 로그인 → `/supervisor/requests` → `검토`, `상세`, `열기`, `Review` 계열 텍스트 탭
- Expected: `/supervisor/requests/[id]` 상세로 이동
- Actual: 상세 URL 이동 없음. `상세 보기` 버튼은 화면에 보이지만 자동 클릭 타깃 매핑이 불안정함
- Evidence:
  - `52-supervisor-requests-mobile-final.png`
  - `53-supervisor-requests-after-cta-final.png`

### E-09. 슈퍼바이저 요청 큐 하단 내비게이션이 카드 내용을 가림

- Severity: P2
- Area: Supervisor requests responsive
- Repro: `/supervisor/requests` 모바일 하단 카드 확인
- Expected: 하단 fixed nav와 마지막 카드/CTA 사이에 충분한 safe-area padding
- Actual: 하단 nav가 마지막 카드의 `결과 보고서 보기` 영역 위를 덮는 형태로 보임
- Evidence:
  - `53-supervisor-requests-after-cta-final.png`

### E-10. 로그인/회원가입/비밀번호 화면은 주요 overflow 없이 렌더링됨

- Severity: Info
- Area: Auth
- Repro: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`
- Result: 주요 control overflow는 자동 검사에서 발견되지 않음
- Evidence:
  - `30-login-mobile-final.png`
  - `31-signup-mobile-final.png`
  - `32-forgot-password-mobile-final.png`
  - `33-reset-password-mobile-final.png`
  - `34-verify-email-mobile-final.png`

### E-11. 결제/설정 화면은 주요 overflow 없이 렌더링됨

- Severity: Info
- Area: Payments/settings
- Repro: supervisee 로그인 → `/payments`, `/settings`
- Result: 주요 control overflow는 자동 검사에서 발견되지 않음
- Evidence:
  - `47-payments-mobile-final.png`
  - `48-settings-mobile-final.png`

### E-12. 슈퍼바이저 보조 화면은 렌더링되지만 상호작용은 별도 확인 필요

- Severity: Info
- Area: Supervisor secondary screens
- Repro: supervisor 로그인 → `/supervisor`, `/supervisor/availability`, `/supervisor/qualifications`, `/supervisor/payouts`
- Result: 페이지 렌더링 및 모바일 폭 overflow는 큰 문제 없음. 저장/추가류 버튼의 실제 기능 연결은 Agent E 범위에서 별도 수정하지 않음.
- Evidence:
  - `51-supervisor-dashboard-mobile-final.png`
  - `54-supervisor-availability-mobile-final.png`
  - `55-supervisor-qualifications-mobile-final.png`
  - `56-supervisor-payouts-mobile-final.png`

## Suggested Fix Batch For Confirmation

수정 전 사용자 컨펌이 필요합니다. 권장 수정 묶음은 아래와 같습니다.

1. `stitch-interactivity.tsx` 모바일 메뉴 토글 구현
   - 홈/검색/슈퍼바이저 콘솔의 `menu`, `필터`, bottom-nav류 클릭을 원본 DOM class toggle 방식으로 연결.

2. `/supervisors` 모바일 카드 CTA 연결
   - `프로필 보기`는 클릭된 카드 또는 첫 공개 프로필 ID로 상세 이동.
   - `의뢰 신청하기` 계열 CTA는 해당 serviceProductId를 유지해 `/requests/new`로 이동.

3. `/requests/new` 모바일 위저드 상태 복구
   - `btn-next`, `btn-back`, `btn-submit` 이벤트 위임이 모바일 마크업에도 적용되도록 수정.
   - Step 1/2/3 active class, progress width, submit redirect를 확인.

4. `/supervisor/requests` 상세 진입과 하단 safe-area 보정
   - `상세 보기`/`기록지 작성`/`결과 보고서 보기`를 기존 상세 라우트로 연결.
   - fixed bottom nav가 마지막 카드 CTA를 가리지 않도록 모바일 padding만 보정.

## Files Created

- `audit-raw.json`
- `REPORT.md`
- `*-clickables.json`
- `01-*.png` through `56-*.png`
