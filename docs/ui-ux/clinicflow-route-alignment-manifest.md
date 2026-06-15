# ClinicFlow Route Alignment Manifest

이 문서는 현재 승인된 14개 Tech Preview 섹션을 실제 route surface에 대응시키는 기준표입니다.

## 고정 기준

- 승인 디자인 원본: `demo-evidence/rebuild-tech-ui/all-pages-20260614-0400/*.png`
- 리뷰용 HTML 동기화본: `demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html`
- 실제 앱 source는 정적 HTML을 런타임에서 읽지 않고, origin-14 원형을 React route/component로 확장합니다.
- 승인 섹션 수: 14
- 실제 page template 수: 44
- Web app: 35
- Admin app: 9

14개 섹션은 전체 페이지 수가 아니라 UI 원형입니다. 실제 route는 아래 표의 `기준 원형`을 따라야 합니다. 44개 route screenshot은 이 표를 검증하기 위한 결과물이며, 14개 원본보다 우선하지 않습니다.

## Non-Regression Rule

새 route, locked state, fallback state, admin/supervisor page를 만들 때도 별도 스타일을 발명하지 않습니다. 반드시 14개 원본 중 하나를 확장합니다.

- Public: `홈`, `슈퍼바이저 찾기`, `로그인`, `진행 방식`
- Supervisee workflow: `새 슈퍼비전 의뢰`, `사례 자료 정리`, `의뢰 상세`, `결제 내역`, `수락 대기`, `학습 기록`
- Supervisor: `슈퍼바이저 업무`, `슈퍼바이저 검토 화면`
- Admin: `자격 심사`, `운영 화면`

이 규칙은 전체 구현에서 가장 강한 UI 규칙입니다.

## Header Rule

전역 헤더는 공개 탐색만 담당합니다.

- 허용: `ClinicFlow`, `슈퍼바이저 찾기`, `이용 가이드`, `로그인`, 시작 CTA
- 금지: `자료 제출`, `자료 업로드`, `현재 단계`, `결제`, `수락 대기`, `학습 기록`, `검토`, `운영`

역할별 작업은 각 route 내부의 진행 바, page header, 고정 side panel에서만 노출합니다.

Admin app의 `/admin/*` 내비게이션은 공개 전역 헤더가 아니라 운영자 전용 local navigation입니다. 단, 이 경우에도 `운영 화면` 원형을 따라 작고 밀도 있게 유지하며, 일반 사용자 화면의 헤더 계약으로 역류시키지 않습니다.

## Status Type

- `production`: 실제 세션, 데이터, 권한, API 흐름을 사용합니다.
- `preview-only`: 승인 UI 확인용 정적/준정적 route입니다.
- `static-info`: 법적/안내성 정보 route입니다.
- `locked-state`: 권한이 없을 때 운영 화면 대신 안내 surface를 보여줍니다.
- `alias/redirect`: 기존 경로나 호환 경로를 canonical route로 연결합니다.

## Web Route Alignment

| Route                        | Status         | 기준 원형            | UI 원칙                                                                              |
| ---------------------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `/`                          | production     | 홈                   | 서비스 정의, 4단계 흐름, 시작 CTA 중심의 실제 React page                             |
| `/login`                     | production     | 로그인               | 실제 로그인 form과 계정 진입 행동 하나만 노출                                        |
| `/signup`                    | production     | 로그인               | 계정 생성은 로그인과 같은 조용한 account surface                                     |
| `/forgot-password`           | production     | 로그인               | 복구 행동 하나만 노출                                                                |
| `/reset-password`            | production     | 로그인               | 새 비밀번호 설정 행동 하나만 노출                                                    |
| `/email/verify`              | production     | 로그인               | 이메일 확인 상태와 다음 행동 중심                                                    |
| `/verify-email`              | alias/redirect | 로그인               | `/email/verify` 호환 경로                                                            |
| `/supervisors`               | production     | 슈퍼바이저 찾기      | 실제 공개 슈퍼바이저 데이터를 사진, 자격, 전문분야, 자기소개 중심으로 비교           |
| `/supervisors/[id]`          | production     | 슈퍼바이저 찾기      | 실제 공개 프로필, 자격, 세션 선택, 신청 시작 행동 중심                               |
| `/guide`                     | static-info    | 진행 방식            | 결제 흐름이 아니라 교육 흐름을 실제 React page로 설명                                |
| `/resources`                 | static-info    | 진행 방식            | 독립 자료실이 아니라 진행 방식 안의 참고 자료                                        |
| `/clinical-guidelines`       | static-info    | 진행 방식            | 자료 작성 기준과 확인 기준만 간결하게                                                |
| `/terms`                     | static-info    | 운영 화면            | 읽기 쉬운 약관 surface                                                               |
| `/privacy`                   | static-info    | 운영 화면            | 읽기 쉬운 개인정보 안내 surface                                                      |
| `/security`                  | static-info    | 운영 화면            | 보안 jargon보다 사용자가 이해할 보호 방식                                            |
| `/sensitive-consent`         | static-info    | 운영 화면            | 민감 자료 동의와 제출 전 확인                                                        |
| `/requests`                  | production     | 의뢰 상세            | 진행 중 의뢰와 다음 행동 line list                                                   |
| `/requests/new`              | production     | 새 슈퍼비전 의뢰     | 슈퍼바이저 확인 -> 세션 확인 -> 일정 확인 -> 초안 저장. 자료 정리는 의뢰 상세로 연결 |
| `/requests/[id]`             | production     | 의뢰 상세            | 현재 상태, 다음 행동, 자료, 피드백, 학습 기록                                        |
| `/case-archive`              | production     | 학습 기록            | 슈퍼바이저별 folder-like 기록 구조                                                   |
| `/payments`                  | production     | 결제 내역            | 결제 대상, 금액, 상태, 연결 의뢰를 한 줄씩                                           |
| `/payments/[id]`             | production     | 결제 내역            | 영수증/환불 가능 여부를 불안 감소형으로                                              |
| `/payments/confirm`          | production     | 수락 대기            | 결제 후 다음 상태 확인                                                               |
| `/notifications`             | production     | 운영 화면            | 지금 확인할 알림 하나와 알림 기록 line list                                          |
| `/settings`                  | production     | 운영 화면            | 기본 계정/신청자 프로필 본문과 하나의 계정 확인 side panel                           |
| `/me`                        | alias/redirect | 운영 화면            | 현재 사용자 role에 맞는 canonical route로 연결                                       |
| `/supervisor`                | production     | 슈퍼바이저 업무      | 숫자 dashboard가 아니라 오늘 이어갈 의뢰 queue                                       |
| `/supervisor/requests`       | production     | 슈퍼바이저 업무      | 검토 queue와 다음 처리 행동                                                          |
| `/supervisor/requests/[id]`  | production     | 슈퍼바이저 검토 화면 | 사례 자료, 판단, 피드백 작성, 처리 기록                                              |
| `/supervisor/profile`        | production     | 슈퍼바이저 찾기      | public profile preview와 수정 form                                                   |
| `/supervisor/availability`   | production     | 운영 화면            | 일정 설정은 저장 행동 하나로                                                         |
| `/supervisor/products`       | production     | 운영 화면            | 제공 세션/지도 방식 관리                                                             |
| `/supervisor/payouts`        | production     | 결제 내역            | 정산 상태와 예정일 중심                                                              |
| `/supervisor/memory`         | production     | 학습 기록            | 재사용 가능한 supervision context를 기록처럼                                         |
| `/supervisor/qualifications` | production     | 자격 심사            | 제출 서류 상태와 다음 보완 행동                                                      |

보호된 supervisee/supervisor route는 로그인 전 데모 화면을 노출하지 않습니다. 권한이 없으면 `locked-state` 안내를 먼저 보여주고, 실제 데이터는 로그인과 role 확인 뒤 렌더링합니다.

## Admin Route Alignment

| Route                   | Status         | 기준 원형 | UI 원칙                               |
| ----------------------- | -------------- | --------- | ------------------------------------- |
| `/`                     | alias/redirect | 운영 화면 | admin app root compatibility          |
| `/admin`                | production     | 운영 화면 | 운영자가 오늘 처리할 일을 먼저 봅니다 |
| `/admin/queue`          | production     | 운영 화면 | action-required queue 중심            |
| `/admin/qualifications` | production     | 자격 심사 | 승인, 추가 확인, 반려 판단을 분리     |
| `/admin/refunds`        | production     | 운영 화면 | 환불 사유, 금액, 처리 상태 중심       |
| `/admin/payouts`        | production     | 결제 내역 | 정산 대상, 금액, 예정일 중심          |
| `/admin/audit`          | production     | 운영 화면 | 처리 기록은 dense하지만 scannable하게 |
| `/payouts`              | alias/redirect | 결제 내역 | `/admin/payouts`로 연결               |
| `/refunds`              | alias/redirect | 운영 화면 | `/admin/refunds`로 연결               |

## Remaining Release Gap

이 manifest는 UI 아키텍처 정렬 기준입니다. 판매 가능 판정은 별도로 다음 증거가 필요합니다.

- typecheck/lint/build 통과
- 실제 로그인 role별 route smoke
- Supabase 데이터 흐름 확인
- 파일 업로드/미리보기 E2E
- 결제 staging/production E2E
- Vercel 배포 smoke와 screenshot QA
