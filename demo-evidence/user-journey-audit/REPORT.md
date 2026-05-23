# User Journey Video Audit

Generated at: 2026-05-22T20:21:43.105Z

## Clarified Recruitment Meaning

이번 감사에서 "초빙된 슈퍼바이저"는 별도 초대 링크 사용자가 아니라, 모집 안내 또는 서비스 URL을 보고 자연스럽게 들어온 신규 슈퍼바이저 지원자로 해석했습니다.

## Video Artifacts

- `videos/supervisor-recruitment-profile.webm`
- `videos/supervisee-search-payment-materials.webm`
- `videos/supervisor-request-workflow.webm`

## Summary

- Launch Blockers: 0
- Beta Acceptable: 0
- Polish: 0

## Launch Blockers

- 없음

## Beta Acceptable

- 없음

## Polish

- 없음

## Steps

| Actor | Step | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| supervisor | 모집 URL 랜딩 진입 | `/` | ok |  |
| supervisor | 회원가입 화면 진입 | `/signup` | ok |  |
| supervisor | 회원가입 제출 | `/signup` | ok | screenshots/supervisor-03-signup-filled.png |
| supervisor | 로그인 | `/login` | ok | screenshots/supervisor-login.png |
| supervisor | 프로필 작성 화면 | `/supervisor/profile` | ok |  |
| supervisor | 자격 관리 화면 | `/supervisor/qualifications` | ok |  |
| supervisor | 상품 관리 화면 | `/supervisor/products` | ok |  |
| supervisor | 가능시간 관리 화면 | `/supervisor/availability` | ok |  |
| supervisee | 로그인 | `/login` | ok | screenshots/supervisee-login.png |
| supervisee | 슈퍼바이저 검색 | `/supervisors` | ok |  |
| supervisee | 슈퍼바이저 상세 확인 | `/supervisors/10000000-0000-4000-8000-000000000101` | ok |  |
| supervisee | 결제/영수증 목록 | `/payments` | ok |  |
| supervisor | 로그인 | `/login` | ok | screenshots/supervisor-login.png |
| supervisor | 슈퍼바이저 의뢰 큐 | `/supervisor/requests` | ok |  |
