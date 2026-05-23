# EPIC 6 Decisions

## Platform Fee

플랫폼 수수료는 부록 C A-04에 맞춰 결제 금액의 20%로 계산한다. 원 단위 정수
금액만 저장하므로 `floor(amount * 0.2)`를 사용하고, 슈퍼바이저 정산액은
`amount_krw - platform_fee_krw`로 DB CHECK 제약까지 둔다. 반올림보다 floor가
사용자에게 과금되지 않은 1원 이득을 플랫폼이 취하지 않는 보수적 정책이다.

## Toss Client Boundary

토스페이먼츠 연동은 `packages/shared/src/payments/toss/`의 `TossClient` 인터페이스
뒤로 격리한다. 이번 묶음은 `TOSS_MODE=dev`에서 결정론적 응답을 주는 dev 어댑터만
사용하고, `prod` 모드는 throw로 막았다. 실제 fetch 어댑터, 토스 테스트 키 승인,
SDK/e2e 검증은 운영 전환 전 별도 묶음에서 회수한다.

## Idempotency

결제 확인 멱등성은 `payments.pg_order_id` UNIQUE, `pg_payment_key` partial UNIQUE,
그리고 라우트의 status check로 처리한다. 별도 `webhook_events` 테이블은 만들지
않았다. 현재 웹훅은 같은 이벤트가 다시 와도 이미 paid/partially_refunded인 결제면
200 ack와 `processed=false`를 반환한다.

## Refund Policy

부분 환불은 다회 허용한다. 다만 요청 생성 시 기존 requested/completed 환불 합계와
새 요청 금액이 결제 원금을 넘지 못하게 막는다. 전액 환불이 완료되면 payment와
supervision_request를 `refunded`로 전이하고, 부분 환불은 payment만
`partially_refunded`가 되며 의뢰 상태는 유지한다.

## Payout Period

정산 산출은 같은 `(supervisor_id, period_start, period_end)`에 대해 UPSERT한다.
스펙의 월 2회 정산은 운영에서 `1-15일`, `16-말일` 기간을 넣는 방식으로 달성하고,
MVP에서는 cron 없이 관리자 수동 API 트리거만 제공한다. cron/알림은 EPIC 11에서
붙인다.

## Status Transitions

EPIC 6 자동 전이는 `submitted -> awaiting_payment -> paid ->
awaiting_supervisor_review`이며 actor는 상태머신상 `system`으로 기록한다. 명시적 환불
승인은 admin actor가 `paid` 또는 `awaiting_supervisor_review`에서 `refunded`로 전이할
수 있다. 슈퍼바이저 거절 시 자동 환불은 EPIC 8 워크플로에서 회수한다.

## Unresolved

- 토스 운영 키 발급, 웹훅 URL 등록, 웹훅 시크릿 회전 정책은 외부 콘솔 작업이 필요하다.
- 실제 `TOSS_MODE=prod` 어댑터와 토스 SDK 클라이언트 연동은 e2e 승인 환경이 준비된 뒤 구현한다.
- 정산 기간의 최종 운영 정책은 반월 기본값으로 시작하되 회계 운영팀 확인이 필요하다.
