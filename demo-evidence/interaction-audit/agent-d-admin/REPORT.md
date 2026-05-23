# Agent D Admin Interaction Audit

작업 범위: Admin + cross-app operational UI  
테스트 일시: 2026-05-22  
대상:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- 계정: `admin@demo.local` / `DemoPass!23`

코드/설정 변경 없음. 이 폴더 아래 스크린샷과 노트만 생성했다.

## 요약

Admin 계정으로 web 로그인 후 admin 앱으로 이동하는 경로는 동작한다.

하지만 admin 대시보드는 현재 실제 운영 콘솔 네비게이션이 아니라 Stitch 원본의 정적 대시보드 마크업에 가깝다. 사이드바의 `Dashboard`, `Case Review`, `Profile`, `Services`, `Schedule`, `Settings`, `Sign Out`는 모두 `href="#"` 또는 무동작 버튼으로 남아 있으며, 실제 `/admin/qualifications`, `/admin/refunds`, `/admin/payouts`로 연결되지 않는다.

`/admin/qualifications`, `/admin/refunds`, `/admin/payouts`는 직접 URL 접근 시 화면은 렌더링된다. 다만 현재 seed 상태에서는 승인/환불/정산 대상이 없어 실제 approve/reject/compute 버튼은 보이지 않는다. 특히 refunds/payouts의 뒤로가기·필터 아이콘은 시각 요소로 보이나 실제 `<a>`/`button`이 아니라 클릭 대상이 아니다.

## 확인 결과

### 1. Web 로그인에서 Admin 이동

재현:

1. `http://localhost:3000/login` 접속
2. `admin@demo.local` / `DemoPass!23` 입력
3. 로그인 버튼 클릭

결과:

- `http://localhost:3001/admin`으로 이동함.
- 정상 동작.

증거:

- `01-web-login-admin-before.png`
- `02-web-login-admin-after-submit.png`
- `03-after-admin-login-current-page.png`

## 주요 이슈

### D-01. Admin dashboard 사이드바가 실제 admin 라우트와 연결되지 않음

심각도: 높음

재현:

1. `http://localhost:3001/admin` 접속
2. 좌측 사이드바의 `Case Review`, `Profile`, `Services`, `Schedule`, `Settings`, `Sign Out` 클릭

기대:

- 운영 메뉴가 실제 admin 라우트로 이동해야 함.
- 예: 자격 승인, 환불 큐, 정산, 대시보드.

실제:

- 대부분 `http://localhost:3001/admin#`로만 바뀌거나 아무 변화가 없음.
- API 요청 없음.
- `Sign Out`도 로그아웃하지 않음.

증거:

- `10-dashboard.png`
- `50-dashboard-click-01-clinical-notes-case-review.png`
- `50-dashboard-click-02-badge-profile.png`
- `50-dashboard-click-03-payments-services.png`
- `50-dashboard-click-04-calendar-month-schedule.png`
- `50-dashboard-click-06-settings-settings.png`
- `50-dashboard-click-07-logout-sign-out.png`
- `dashboard-control-clicks.json`

### D-02. Admin dashboard의 CTA/상세 버튼들이 정적 버튼임

심각도: 높음

재현:

1. `http://localhost:3001/admin` 접속
2. `New Feedback`, 알림, 도움말, `모두 보기`, 각 행의 `상세` 클릭

기대:

- 실제 운영 액션 또는 상세 화면으로 이동해야 함.
- 아직 기능 범위 밖이면 버튼처럼 보이지 않거나 비활성/설명 상태여야 함.

실제:

- URL 변화 없음.
- API 요청 없음.
- 화면 변화 없음.

증거:

- `50-dashboard-click-05-new-feedback.png`
- `50-dashboard-click-08-notifications.png`
- `50-dashboard-click-09-help.png`
- `50-dashboard-click-10-모두-보기.png`
- `50-dashboard-click-11-상세.png`
- `50-dashboard-click-12-상세.png`
- `50-dashboard-click-13-상세.png`
- `50-dashboard-click-14-상세.png`

### D-03. Admin dashboard의 화면 내용이 운영자 콘솔 도메인과 섞여 있음

심각도: 중간

관찰:

- 데스크톱 대시보드는 `Supervision Pro`, `Dr. Kim, PhD`, `Case Review`, `Services`, `Schedule`, `New Feedback` 등 슈퍼바이저 콘솔에 가까운 문맥을 보여준다.
- 모바일 대시보드는 `ClinicalSup`, `운영자님`, 자격 심사/환불/지급 카드가 보이므로 데스크톱과 모바일의 정보구조가 서로 다르다.

기대:

- Admin 대시보드 데스크톱/모바일 모두 같은 운영자 정보구조를 가져야 함.

증거:

- `10-dashboard.png`
- `mobile-admin-dashboard-auth.png`

### D-04. Qualifications 화면은 직접 접근 가능하지만 실제 승인 액션을 테스트할 대상이 없음

심각도: 낮음 또는 데이터 상태 의존

재현:

1. `http://localhost:3001/admin/qualifications` 접속

결과:

- 화면 렌더링 정상.
- 현재 `승인 대기 자격이 없습니다`로 표시됨.
- approve/reject 버튼 없음.

비고:

- empty state 자체는 자연스럽지만, filter/search tab은 시각적으로 버튼처럼 보이나 자동화 기준에서 실제 컨트롤로 잡히지 않았다.
- 승인 액션 wiring 여부는 pending qualification seed가 있는 상태에서 재검증 필요.

증거:

- `10-qualifications.png`
- `mobile-admin-qualifications-auth.png`
- `40-qualification-approve-button-not-found.png`
- `40-qualification-reject-button-not-found.png`

### D-05. Refunds 화면은 직접 접근 가능하지만 approve/reject 액션이 보이지 않음

심각도: 낮음 또는 데이터 상태 의존

재현:

1. `http://localhost:3001/admin/refunds` 접속

결과:

- 화면 렌더링 정상.
- `대기 중인 환불 없음`으로 표시됨.
- approve/reject 버튼 없음.
- 뒤로가기/필터 아이콘은 보이나 실제 컨트롤이 아님.

증거:

- `10-refunds.png`
- `mobile-admin-refunds-auth.png`
- `40-refund-approve-button-not-found.png`
- `40-refund-reject-button-not-found.png`

### D-06. Payouts 화면에 compute 실행 UI가 없음

심각도: 중간

재현:

1. `http://localhost:3001/admin/payouts` 접속

기대:

- 운영자가 기간을 지정하고 정산 산출을 실행할 수 있는 UI가 있거나, 아직 미구현이면 명확히 비활성/준비중 표시가 필요함.

실제:

- 화면에는 `compute API를 실행하면 supervisor별 정산이 표시됩니다`라는 안내만 있음.
- compute 실행 버튼이나 기간 입력 UI는 없음.
- 뒤로가기/필터 아이콘은 보이나 실제 컨트롤이 아님.

증거:

- `10-payouts.png`
- `mobile-admin-payouts-auth.png`
- `40-payout-compute-button-not-found.png`

## 스크린샷 인덱스

핵심 화면:

- `10-dashboard.png`
- `10-qualifications.png`
- `10-refunds.png`
- `10-payouts.png`
- `mobile-admin-dashboard-auth.png`
- `mobile-admin-qualifications-auth.png`
- `mobile-admin-refunds-auth.png`
- `mobile-admin-payouts-auth.png`

로그인 흐름:

- `01-web-login-admin-before.png`
- `02-web-login-admin-after-submit.png`
- `03-after-admin-login-current-page.png`

대시보드 전수 클릭:

- `50-dashboard-click-00-dashboard-dashboard.png`
- `50-dashboard-click-01-clinical-notes-case-review.png`
- `50-dashboard-click-02-badge-profile.png`
- `50-dashboard-click-03-payments-services.png`
- `50-dashboard-click-04-calendar-month-schedule.png`
- `50-dashboard-click-05-new-feedback.png`
- `50-dashboard-click-06-settings-settings.png`
- `50-dashboard-click-07-logout-sign-out.png`
- `50-dashboard-click-08-notifications.png`
- `50-dashboard-click-09-help.png`
- `50-dashboard-click-10-모두-보기.png`
- `50-dashboard-click-11-상세.png`
- `50-dashboard-click-12-상세.png`
- `50-dashboard-click-13-상세.png`
- `50-dashboard-click-14-상세.png`

원자료:

- `raw-results.json`
- `dashboard-control-clicks.json`

## 수정 제안

최종 수정 전 사용자 컨펌 필요.

추천 수정 범위:

1. `/admin` 데스크톱 대시보드의 Stitch static 사이드바를 실제 admin 운영 메뉴로 연결
   - `자격 승인` → `/admin/qualifications`
   - `환불 큐` → `/admin/refunds`
   - `정산` → `/admin/payouts`
   - `로그아웃` → 기존 logout API 또는 web login 상태 정리 경로
2. admin dashboard의 `New Feedback`, `상세`, `모두 보기`, 알림/도움말 등 현재 기능 없는 버튼은 제거하거나 비활성/준비중 상태로 변경
3. 데스크톱 admin dashboard의 슈퍼바이저 문맥 문구를 운영자 문맥으로 통일
4. payouts 화면에 최소한의 기간 입력 + compute 실행 CTA를 둘지, 아니면 “운영 API 전용”으로 명확히 표시할지 결정
5. pending qualification/refund seed가 있는 상태에서 approve/reject UI를 별도 재검증
