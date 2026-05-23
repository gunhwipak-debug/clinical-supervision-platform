# User Journey Storyboards

Generated from the latest localhost audit. "초빙된 슈퍼바이저"는 별도 초대 링크가 아니라 공개 URL을 보고 자연스럽게 들어온 모집 대상 슈퍼바이저로 해석했습니다.

## Summary

- Latest audit report: `REPORT.md`
- Raw results: `raw-results.json`
- Launch blockers: 0
- Videos:
  - `videos/supervisor-recruitment-profile.webm`
  - `videos/supervisee-search-payment-materials.webm`
  - `videos/supervisor-request-workflow.webm`

## Supervisor Recruitment / Onboarding

Video: `videos/supervisor-recruitment-profile.webm`

1. 공개 URL 랜딩 진입
   - Evidence: `screenshots/supervisor-01-landing.png`
   - Purpose: 모집 안내나 서비스 URL을 받은 슈퍼바이저가 첫 화면에서 서비스를 이해합니다.

2. 슈퍼바이저 역할로 회원가입
   - Evidence: `screenshots/supervisor-02-signup.png`
   - Evidence: `screenshots/supervisor-03-signup-filled.png`
   - Purpose: 회원가입 화면에서 `슈퍼바이저로 등록` 역할을 선택할 수 있습니다.

3. 가입 후 안내 확인
   - Evidence: `screenshots/supervisor-04-after-signup.png`
   - Purpose: 실제 운영에서는 이메일 인증 후 로그인으로 이어집니다. 데모 감사는 기존 승인 슈퍼바이저 계정으로 이어서 온보딩 화면을 확인합니다.

4. 프로필 작성 및 저장
   - Evidence: `screenshots/supervisor-05-profile-before-edit.png`
   - Evidence: `screenshots/supervisor-06-profile-after-save-click.png`
   - Purpose: 슈퍼바이저가 공개 표시명, 헤드라인, 소개 문구를 작성해 의미 있는 프로필을 구성합니다.

5. 자격, 상품, 가능시간 관리
   - Evidence: `screenshots/supervisor-07-qualifications.png`
   - Evidence: `screenshots/supervisor-08-products.png`
   - Evidence: `screenshots/supervisor-09-availability.png`
   - Purpose: 슈퍼바이저가 자격 제출, 서비스 상품, 가능시간을 관리할 수 있는 진입면을 확인합니다.

## Supervisee Search / Request / Payment / Materials

Video: `videos/supervisee-search-payment-materials.webm`

1. 슈퍼바이지 로그인
   - Evidence: `screenshots/supervisee-login.png`
   - Purpose: 슈퍼비전을 받을 사용자가 기존 계정으로 진입합니다.

2. 슈퍼바이저 검색
   - Evidence: `screenshots/supervisee-01-search.png`
   - Purpose: 공개 승인된 슈퍼바이저만 검색 결과에 표시됩니다.

3. 슈퍼바이저 상세 및 상품 선택
   - Evidence: `screenshots/supervisee-02-supervisor-detail.png`
   - Evidence: `screenshots/supervisee-03-after-schedule-cta.png`
   - Purpose: 슈퍼바이지가 프로필, 자격, 전문분야, 상품, 가능시간을 보고 의뢰를 시작합니다.

4. 새 의뢰 초안 생성
   - Evidence: `screenshots/supervisee-04-new-request.png`
   - Evidence: `screenshots/supervisee-05-request-submitted.png`
   - Purpose: 선택한 상품으로 의뢰 초안을 만들고 상세 화면으로 이동합니다.

5. 케이스 패킷 및 비식별화 체크
   - Evidence: `screenshots/supervisee-06-request-ready-for-payment.png`
   - Purpose: 제목, 주호소, 의뢰 사유를 저장하고 12개 비식별화 체크리스트를 완료한 뒤 제출합니다.

6. 결제
   - Evidence: `screenshots/supervisee-07-after-payment.png`
   - Purpose: 제출된 의뢰에서 결제 CTA를 누르면 dev Toss 흐름으로 결제가 확인되고 `슈퍼바이저 검토 대기` 상태가 됩니다.

7. 결제/영수증 목록
   - Evidence: `screenshots/supervisee-08-payments.png`
   - Purpose: 사용자가 결제 내역과 영수증 흐름을 확인합니다.

## Supervisor Request Workflow

Video: `videos/supervisor-request-workflow.webm`

1. 슈퍼바이저 로그인
   - Evidence: `screenshots/supervisor-login.png`

2. 의뢰 큐 확인
   - Evidence: `screenshots/supervisor-workflow-01-request-queue.png`
   - Purpose: 결제 후 검토 대기 상태가 된 신규 의뢰를 큐에서 확인합니다.

3. 의뢰 상세 검토
   - Evidence: `screenshots/supervisor-workflow-02-request-detail.png`
   - Purpose: PHI 본문은 검토 목적 안에서만 표시되고, 슈퍼바이저는 수락 또는 반려 CTA로 다음 행동을 시작할 수 있습니다.

## Notes for Next QA Pass

1. 현재 감사는 실제 localhost UI를 조작하고 녹화하며, 결과상 launch blocker는 없습니다.
2. 가입 직후 이메일 인증은 운영 흐름상 별도 토큰 확인이 필요하므로, 온보딩 감사에서는 기존 승인 슈퍼바이저 계정으로 프로필/자격/상품/가능시간 화면을 이어서 확인했습니다.
3. 일정 선택은 현재 상품 CTA와 가능시간 표시 중심이며, 실제 예약/Zoom 슬롯 확정은 EPIC 7에서 별도 회수합니다.
4. 파일 업로드는 패널 진입과 정책 표시까지 확인했습니다. 실제 파일 운영 실체화는 EPIC 5 범위입니다.
