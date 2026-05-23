# Clinical Supervision Marketplace — Codex 핸드오프 Plan

> **목적**: 한국 심리평가/심리치료 슈퍼비전 마켓플레이스의 MVP를 Codex가 즉시 착수할 수 있는 수준으로 명세한다. 본 문서를 Codex 작업 컨텍스트에 그대로 붙여넣어 사용한다.
>
> **버전**: v1.0 (2026-05-18 작성)
> **프로젝트 코드명**: `ClinicalSupervisionPlatform` (내부 약어: `CSP`)
> **레포 예정 경로**: `/Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform`
> **psy-report-assistant와의 관계**: **완전 분리**. 별도 GitHub repo, 별도 Supabase 프로젝트, 별도 도메인. 스택/RLS 패턴만 차용.
> **출시 형태**: 비공개 파일럿(초청장 코드). 슈퍼바이저 10~20명, 슈퍼바이지 30~50명 베타.
> **법률 자문**: 본 문서의 "⚖️ 법률 검토 필요" 표시는 반드시 한국 변호사 검토 후 확정.
>
> **Codex 작업 지침**:
>
> 1. 모든 코드는 TypeScript strict + Drizzle ORM. 임상자료(케이스 패킷·파일·피드백·완료 기록) 보안은 단축 금지.
> 2. PHI(개인정보·임상자료)는 DB 저장 시 컬럼 단위 암호화(pgcrypto AES-256), 파일은 S3 객체 단위 KMS 암호화.
> 3. 임상자료 테이블에는 `FORCE ROW LEVEL SECURITY`. 기본은 deny, 명시적 allow만 허용.
> 4. `withUserContext` 같은 컨텍스트 헬퍼 없이 임상자료 raw DB 쿼리 금지.
> 5. AI 자동해석/AI 문장 생성은 MVP에 포함하지 않는다(추후 별도 모듈).
> 6. 슈퍼바이저의 서명·도장은 한국 임상 관행에 따라 완료 기록서에 첨부 가능. 단, "검증서/보증서/효력 보장" 같은 자격남용·외부 효력 오해 카피는 금지하고 책임범위 고정 문구를 함께 노출한다.
> 7. "1 tier / 2 tier" 용어는 외부 UI·문서·코드 식별자에서 금지. 내부 코드는 `supervisor` / `supervisee`.
> 8. 법률 자문(⚖️ 표시)은 출시 전 게이트가 아니라 백로그 항목으로 관리한다. 단, 의료법/개인정보보호법 위반 가능성이 명백한 기능은 사전 검토 후 도입한다.
> 9. 광고·마케팅 픽셀은 **랜딩·서비스 소개·가격·블로그 등 비임상 페이지에서는 허용**한다. 케이스 패킷·파일·피드백·완료 기록서·관리자 등 **임상자료 페이지에서는 금지**한다(개인정보보호법 위반 위험).

---

## 1. 제품 한 줄 정의

**"심리평가/심리치료 실무자가 검증된 상위 자격 전문가에게 비식별화된 케이스 패킷을 안전하게 제출하고 표준화된 슈퍼비전(코멘트·직접수정·Zoom 회의)을 받는, 책임범위와 감사로그가 기록되는 고신뢰 임상 슈퍼비전 마켓플레이스."**

---

## 2. 핵심 원칙

1. **검색·매칭·예약이 본질**: 슈퍼바이지가 적합한 슈퍼바이저를 빠르게 찾아 결제·예약하도록 만드는 것이 핵심 가치. 안전한 자료 교환과 책임범위 기록은 그 위에 깔리는 기본기다.
2. **수익성 우선 평가**: 모든 설계 결정은 "이 결정이 거래 성사·재이용·수수료에 기여하는가?"를 먼저 평가한다. 단, 임상자료 자체가 유출되면 서비스가 즉시 끝나므로 PHI 보안은 거래 가치를 지키는 전제다.
3. **양방향 구조화 워크플로우**: 슈퍼바이지는 표준 폼에 맞춰 자료를 제출하고, 슈퍼바이저는 구조화된 뷰(보고서 + 검사 결과 + 요청사항)에서 한눈에 검토한다. 산만한 자료 제출은 슈퍼비전 품질·시간을 망친다.
4. **책임의 명확화**: 슈퍼바이저는 "검토 범위 내"의 슈퍼비전을 제공한다. 한국 임상 관행상 슈퍼비전 결과에 슈퍼바이저 이름·서명이 첨부되는 것은 자연스럽지만, 외부 기관(법원·병무청 등) 제출용 효력으로 오해되지 않도록 책임범위 고정 문구를 함께 표시한다.
5. **AI는 MVP 미포함**: LLM 자동해석·자동문장은 환각·과잉진단 리스크가 크므로 별도 모듈로 분리해 향후 검토.
6. **광고·마케팅 적극 도입(임상자료 페이지 제외)**: 본 서비스는 상업적 마켓플레이스이며, 랜딩·서비스 소개·가격·블로그·검색 등 비임상 페이지에서는 외부 픽셀·SDK·리타게팅 환영. 케이스 패킷·파일·피드백·완료 기록·관리자 등 PHI를 다루는 페이지에서는 픽셀·외부 SDK 미장착(법 위반 위험 차단).
7. **위계 표현 금지**: 외부 UI에서 "1tier/2tier" 용어 사용 금지. "슈퍼바이저/슈퍼바이지/실무자"만 사용.
8. **관리형 마켓플레이스**: 초기에는 운영팀이 슈퍼바이저 자격을 수동 검증하고, 분쟁 시 직접 개입한다.
9. **법률 검토는 백로그**: 출시 전 변호사 게이트 대신, 의료법·정신건강복지법·개인정보보호법 관련 항목은 §부록 B의 백로그로 관리하면서 구현을 우선한다.
10. **기록 가능성**: 누가, 언제, 어떤 임상자료에 접근했는지는 항상 추적 가능해야 한다(분쟁 대응 + 신뢰 마케팅 자산).

---

## 3. MVP 범위 (8주, 심리평가 슈퍼비전만)

### 3.1 포함 기능 (Must Have)

- 회원가입/로그인: 이메일+비밀번호(또는 아이디+비밀번호)로 간단 가입. 카카오·네이버 소셜 로그인 옵션. 관리자만 TOTP 2FA 필수, 슈퍼바이저는 권장(설정 안내), 슈퍼바이지는 선택. (출시 후 슈퍼바이저 2FA 강제로 정책 강화 가능.)
- 역할 분리: `supervisee`, `supervisor`, `admin` (`organization_admin`은 v2)
- 슈퍼바이저 프로필 (사진·학력·자격·경력·전문분야·서비스 상품·가격·가능시간·소개글)
- 슈퍼바이저 자격 수동 검증 (운영팀이 자격증 사본 확인 후 승인)
- 전문분야·연령대·검사도구 **체크박스 선택 + 키워드 검색** 기반 슈퍼바이저 탐색
- 표준 케이스 패킷 생성 (제목·의뢰목적·대상자기본정보·검사목록·요청사항·희망마감·긴급여부 등 ⇒ §6)
- 비식별화 체크리스트 (업로드 차단 게이트 포함)
- 파일 업로드 (PDF, JPG/PNG, DOCX, XLSX. HWP는 PDF 변환 안내)
- 파일 KMS 암호화 저장 + signed URL 단시간 발급 + 다운로드 워터마크
- 민감정보 처리 동의 (별도 동의서, 버전 관리)
- 결제 (토스페이먼츠, 카드/계좌이체)
- Zoom 슈퍼비전 예약 (슈퍼바이저가 미팅 링크 수동 입력)
- 슈퍼비전 상태 흐름 (§8)
- 비동기 코멘트 슈퍼비전 (보고서에 인라인 코멘트 + 종합 피드백)
- 직접 수정 슈퍼비전 (수정본 파일 업로드)
- 슈퍼비전 완료 기록서 (§15)
- 구조화 리뷰 (별점 + 9개 항목)
- 관리자 대시보드 (사용자, 자격검증, 의뢰, 결제, 환불, 신고, 로그)
- 접근 로그·감사 로그
- 보관기간 설정 (7/30/90일) + 자동 삭제
- 개인정보 삭제 요청 처리 워크플로우
- 알림 (앱 인앱 + 이메일. 민감정보 포함 금지)

### 3.2 비포함 기능 (Out of Scope for MVP)

- AI 자동해석, AI 보고서 작성, raw data 자동분석
- "서명/검증서/보증서를 단독 상품으로 거래"하는 형태 (완료 기록서에 슈퍼바이저 서명·도장이 첨부되는 것은 허용)
- HWP 네이티브 뷰어/편집기
- 심리치료 슈퍼비전 (Phase 2에서 도입)
- 기관 계정 / 월구독 / 사용량 과금 (Phase 2)
- 자유게시판 / 오픈 마켓플레이스
- 무제한 보관 / 백업 사본 다운로드
- 광고 기반 수익모델 자체(주 수익은 거래 수수료. 단, 외부 광고 트래픽 유입·픽셀은 비임상 페이지에서 적극 활용)
- 환자·내담자 직접 이용 기능
- 모바일 네이티브 앱 (반응형 웹만)
- Zoom OAuth 자동 미팅 생성 (수동 링크 입력만)
- 다국어 (한국어만)
- 슈퍼비전 녹화/녹취 (윤리·동의 부담으로 MVP 제외)

---

## 4. 비포함 범위 명시 (의사결정 기록)

| 항목                      | 사유                                                                                   | 재검토 시점                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AI 해석/문장생성          | 환각·과잉진단 리스크, 보고서 책임소재 불명확                                           | Phase 4 별도 모듈 평가                                                                                                |
| 단독 "서명 상품" 거래     | 서명만 사고파는 형태로 보일 경우 자격남용 분쟁 가능 [⚖️ 법률 검토 백로그]              | 한국 임상 관행상 슈퍼비전 결과에 서명·도장이 첨부되는 것은 정상. 본 플랫폼에서는 "슈퍼비전 + 결과 첨부" 형태로만 제공 |
| HWP 통합 뷰어             | HWP 라이선스·렌더링 복잡도                                                             | 사용자 요청 빈도 누적 후                                                                                              |
| 치료 슈퍼비전             | 비식별화 난이도·녹취 동의·치료 관계 책임 등 평가와 다른 차원의 리스크                  | MVP 검증 완료 후                                                                                                      |
| 기관 계정                 | 권한 분리·정산·계약서 복잡도                                                           | Phase 2 (3~6개월 후)                                                                                                  |
| 임상자료 페이지 광고 픽셀 | 케이스·자료·피드백·완료 기록 페이지에 외부 픽셀 박으면 PHI 외부 송신 위험·법 위반 가능 | 영구 금지. 단, 랜딩·서비스 소개·블로그 등 비임상 페이지에서는 광고·픽셀·리타게팅 적극 활용                            |
| 환자 직접 이용            | 정신건강복지법상 의료 행위 경계 [⚖️ 법률 검토 백로그]                                  | 영구 금지 (B2P는 본 플랫폼 모델 아님)                                                                                 |
| Zoom 녹화                 | 슈퍼비전 녹화 동의·보관 책임 [⚖️ 법률 검토 백로그]                                     | 별도 옵트인 상품으로 검토                                                                                             |

---

## 5. 사용자 역할

### 5.1 Supervisee (슈퍼바이지, 의뢰자)

- 정의: 심리평가 실무자(임상심리사 2급, 정신건강임상심리사 2급, 수련생, 청소년상담사 등)
- 외부 표기: "슈퍼바이지", "실무자", "의뢰자" (위계 표현 금지)
- 주요 권한: 자기 케이스 CRUD, 자신이 의뢰한 슈퍼비전 자료 접근, 결제, 리뷰 작성
- 본인 인증: 이메일 인증 + 자격 자기신고(MVP) → Phase 2에서 자격증 사진 인증 도입

### 5.2 Supervisor (슈퍼바이저, 검증 전문가)

- 정의: 임상심리전문가, 정신건강임상심리사 1급, 상담심리사 1급 등 상위 자격 보유자
- 외부 표기: "슈퍼바이저", "검증 전문가", "전문가"
- 주요 권한: 자기 프로필 CRUD, 배정된 슈퍼비전 자료만 접근, 피드백·완료 기록 작성, 정산 조회
- 가입 게이트: 관리자 자격 검증 통과(2FA는 권장, 출시 후 정책 강화 가능)

### 5.3 Admin (관리자, 운영팀)

- 정의: 플랫폼 운영자 (CS, 분쟁 처리, 자격 검증)
- 외부 표기: 사용자에게 노출되지 않음
- 주요 권한: 사용자 관리, 자격 승인, 결제/환불, 신고 처리, 삭제 요청 처리, 감사 로그 조회
- 필수: TOTP 2FA, IP allowlist 옵션, 모든 행동 감사로그 기록

### 5.4 Organization Admin (기관 관리자) — **Phase 2**

- 정의: 병원·상담센터·복지관의 운영 책임자
- MVP에서는 미구현. 데이터 모델은 v2 확장 고려해 `organization_id` 컬럼 미리 포함.

---

## 6. 주요 사용자 플로우 (성공·실패 시나리오)

### 플로우 A: 비대면 슈퍼비전(코멘트형) 의뢰 (대표 플로우)

**성공 시나리오**

1. 슈퍼바이지가 이메일+비밀번호(또는 카카오·네이버)로 가입 → 이메일 인증
2. 역할 선택 화면에서 "슈퍼바이지" 선택, 자격(자기신고)·소속 입력
3. 슈퍼바이저 검색 페이지에서 전문분야 체크박스(성격평가·성인 등) 선택 또는 키워드 검색으로 슈퍼바이저 탐색
4. 슈퍼바이저 상세 페이지에서 "비대면 슈퍼비전(코멘트형) — OO,OOO원" 상품 선택
5. 케이스 패킷 작성 (제목, 의뢰목적, 연령대, 검사목록, 요청사항, 희망마감일)
6. 비식별화 체크리스트 12개 항목 모두 체크 (실패 시 업로드 차단)
7. 파일 업로드: 보고서 초안 PDF + MMPI-2 결과지 PDF + SCT 응답지 PDF
8. 민감정보 처리 동의 + 이용약관 + 보관기간 선택(7/30/90일 중 사용자가 선택)
9. 결제 (토스페이먼츠 카드 결제)
10. 슈퍼바이저에게 알림 → 24시간 내 수락
11. 슈퍼바이저가 자료 다운로드(워터마크) 후 검토
12. 슈퍼바이저가 코멘트(인라인 + 종합) 작성 후 제출
13. 슈퍼바이지가 피드백 확인, 1회 추가 질문 작성 (상품 정책상 1회 무료)
14. 슈퍼바이저가 답변
15. 슈퍼바이지가 "완료" 처리 → 슈퍼바이저가 완료 기록서 발급
16. 슈퍼바이지가 리뷰 작성
17. 30일 후 자동 파일 삭제 (사전 알림 → 삭제 → 감사로그 기록)

**실패 시나리오**

- F-A-1: 비식별화 체크리스트 미완료 → 업로드 버튼 비활성, "이름이 보이는 파일이 감지될 경우 책임은 의뢰자에게 있습니다" 경고
- F-A-2: 파일에 PHI 의심 패턴(주민번호, 휴대폰번호 정규식) 감지 → 업로드 차단 + 파일명·내용 확인 안내
- F-A-3: 결제 실패 → 의뢰는 `AwaitingPayment` 상태로 24시간 유지, 미결제 시 자동 만료
- F-A-4: 슈퍼바이저 24시간 내 미응답 → 자동 알림 → 48시간 미응답 시 자동 취소 + 환불
- F-A-5: 슈퍼바이저가 "전문분야 외" 사유로 거절 → 즉시 환불 + 슈퍼바이저에게 페널티 없음
- F-A-6: 슈퍼바이저가 "추가자료 요청" → 슈퍼바이지에게 알림, 48시간 내 미제출 시 슈퍼바이저는 현재 자료만으로 작성 또는 거절 가능
- F-A-7: 슈퍼바이지가 보관기간 만료 전 삭제 요청 → 운영팀 검토 후 24시간 내 삭제 + 감사로그
- F-A-8: 슈퍼바이저가 작업 중 자료에서 PHI 발견 → "PHI 신고" 버튼으로 운영팀 알림 → 슈퍼바이지에게 안내 + 의뢰 일시정지

### 플로우 B: Zoom 슈퍼비전 예약

1. 슈퍼바이저 상세에서 "비대면 슈퍼비전(회의형, 60분) — OOO,OOO원" 선택
2. 슈퍼바이저 가능시간 슬롯 확인 → 슬롯 선택
3. 케이스 패킷 작성·업로드 (회의 24시간 전까지 마감)
4. 결제
5. 슈퍼바이저 수락 시 예약 확정 → 슈퍼바이저가 Zoom 링크 수동 입력 → 양쪽에 알림
6. 회의 24시간 전·1시간 전 리마인더 (Zoom 링크는 회의 1시간 전부터 노출)
7. 회의 후 슈퍼바이저가 회의 요약 + 완료 기록서 작성
8. 리뷰

**실패 시나리오**

- F-B-1: 회의 24시간 전까지 자료 미제출 → 자동 알림 → 미제출 시 회의 진행 여부 슈퍼바이저 재량
- F-B-2: 슈퍼바이지 노쇼 → 환불 불가 정책 안내 → 분쟁 시 운영팀 중재
- F-B-3: 슈퍼바이저 노쇼 → 즉시 환불 + 다음 슬롯 무료 재예약 옵션 + 슈퍼바이저 페널티(누적 3회 시 일시정지)
- F-B-4: 회의 후 48시간 내 완료 기록 미작성 → 자동 알림 → 7일 미작성 시 운영팀 개입

### 플로우 C: 슈퍼바이저가 의뢰를 거절

1. 슈퍼바이저에게 신규 의뢰 알림
2. 24시간 내 케이스 패킷 검토 (자료는 미공개, 메타정보만 노출)
3. 거절 사유 선택: 전문분야 불일치 / 일정 불가 / 자료 부족 / 윤리 우려 / 기타
4. (선택) 다른 슈퍼바이저 추천 메시지
5. 슈퍼바이지에게 알림 + 자동 환불 (PG 수수료는 플랫폼 부담)
6. 슈퍼바이저 페널티 없음 (단, 24시간 내 응답률은 프로필 노출 랭킹 가중치에 반영)

### 플로우 D: 추가자료 요청

1. 슈퍼바이저가 "추가자료 요청" 선택, 항목 명시 (예: "K-WAIS 소검사별 환산점수표")
2. 슈퍼바이지에게 알림 + 48시간 카운트다운
3. 슈퍼바이지가 추가 자료 업로드 (동일 비식별화 게이트 적용)
4. 슈퍼바이저 검토 재개

**실패 시나리오**

- F-D-1: 48시간 내 미제출 → 슈퍼바이저는 현재 자료로 진행 or 환불 처리
- F-D-2: 추가 자료가 여전히 PHI 포함 → PHI 신고 플로우

### 플로우 E: 환불/분쟁

1. 슈퍼바이지가 의뢰 상세에서 "분쟁 신고" 클릭
2. 사유 선택 + 자유 서술
3. 운영팀에게 알림 → 24시간 내 1차 답변
4. 운영팀이 양측 자료 검토 (감사로그·코멘트·완료 기록 모두 확인)
5. 결과 통지 (전액 환불 / 부분 환불 / 환불 거절)
6. 환불 결정 시 PG 환불 API 호출, 정산 보류분에서 차감
7. 감사로그·분쟁 케이스 기록 영구 보존 (개인정보는 마스킹)

### 플로우 F: 슈퍼바이저 자격 검증

1. 슈퍼바이저 가입 → 자격증 사본·경력증명·신분증 업로드
2. `verification_status = pending`
3. 운영팀에게 알림 → 5영업일 내 검토
4. 운영팀이 자격발급기관·면허 조회 (한국심리학회·정신건강복지센터 등 공식 사이트 수동 조회)
5. 승인/반려/추가자료 요청
6. 승인 시 프로필 공개 + 검증 배지 부여
7. 자격 검증 자료는 별도 암호화 버킷에 5년 보관 (분쟁 대응 목적) [⚖️ 보관기간 법률 검토 필요]

---

## 7. 기능 요구사항 (Functional Requirements)

### 7.1 인증·계정 (FR-AUTH)

| ID         | 요구사항                                                                                                           | 우선 |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | ---- |
| FR-AUTH-01 | 이메일(또는 아이디)+비밀번호 회원가입. 비밀번호 최소 10자, 영문+숫자 조합(특수문자 권장)                           | M    |
| FR-AUTH-02 | 이메일 인증 토큰 발송 (24시간 만료)                                                                                | M    |
| FR-AUTH-03 | 로그인 시 5회 실패 시 30분 잠금                                                                                    | M    |
| FR-AUTH-04 | 관리자 TOTP 2FA 필수. 슈퍼바이저는 권장(가입 후 설정 안내). 슈퍼바이지는 선택. (출시 후 슈퍼바이저 필수 전환 가능) | M    |
| FR-AUTH-05 | 카카오·네이버 소셜 로그인 (슈퍼바이지·슈퍼바이저 모두 가능)                                                        | M    |
| FR-AUTH-06 | 세션은 HTTP-Only Secure SameSite=Lax 쿠키. 30분 유휴 시 자동 로그아웃                                              | M    |
| FR-AUTH-07 | 비밀번호 변경 시 기존 모든 세션 무효화                                                                             | M    |
| FR-AUTH-08 | 비밀번호 재설정 토큰 1시간 만료                                                                                    | M    |
| FR-AUTH-09 | 가입 시 약관·개인정보처리방침·민감정보 처리 동의 분리 체크                                                         | M    |

### 7.2 슈퍼바이저 프로필 (FR-PROF)

| ID         | 요구사항                                                                  | 우선 |
| ---------- | ------------------------------------------------------------------------- | ---- |
| FR-PROF-01 | 프로필 항목: 이름, 사진(필수, JPG/PNG 최대 5MB), 한줄소개, 소개글(2000자) | M    |
| FR-PROF-02 | 학력·경력 다중 입력 (시작·종료 연월)                                      | M    |
| FR-PROF-03 | 자격 다중 입력: 자격명·자격번호·발급기관·취득일·만료일                    | M    |
| FR-PROF-04 | 전문분야 다중 선택 (마스터 카테고리 §10 참조)                             | M    |
| FR-PROF-05 | 서비스 상품 다중 등록 (코멘트형, 직접수정형, 회의형 60/90분, 긴급)        | M    |
| FR-PROF-06 | 가격 입력 (원 단위, 1000원 단위로 반올림)                                 | M    |
| FR-PROF-07 | 주간 가능시간 슬롯 (30분 단위)                                            | M    |
| FR-PROF-08 | 프로필 미리보기 + 운영팀 승인 후 공개                                     | M    |
| FR-PROF-09 | 프로필 수정 시 자격 항목은 재검증 트리거                                  | M    |
| FR-PROF-10 | 책임범위 안내 문구 자동 삽입 (수정 불가)                                  | M    |

### 7.3 검색·매칭 (FR-SEARCH)

| ID           | 요구사항                                         | 우선 |
| ------------ | ------------------------------------------------ | ---- |
| FR-SEARCH-01 | 전문분야 다중 필터                               | M    |
| FR-SEARCH-02 | 슈퍼비전 유형 필터 (코멘트/직수정/Zoom/긴급)     | M    |
| FR-SEARCH-03 | 가격 범위 필터                                   | M    |
| FR-SEARCH-04 | 평균 응답시간·평점 정렬                          | M    |
| FR-SEARCH-05 | 자격 종류 필터                                   | M    |
| FR-SEARCH-06 | 키워드 검색 (이름·소개글, 케이스 정보 검색 금지) | M    |
| FR-SEARCH-07 | 검색 결과에 PHI 노출 금지                        | M    |

### 7.4 슈퍼비전 의뢰 (FR-REQ)

| ID        | 요구사항                                                              | 우선 |
| --------- | --------------------------------------------------------------------- | ---- |
| FR-REQ-01 | 표준 케이스 패킷 폼 (§6.1)                                            | M    |
| FR-REQ-02 | 비식별화 체크리스트 12항목 게이트                                     | M    |
| FR-REQ-03 | 다중 파일 업로드 (최대 10개, 총 200MB)                                | M    |
| FR-REQ-04 | 파일 형식 검증 (MIME + 확장자 + 매직넘버)                             | M    |
| FR-REQ-05 | 업로드 직후 ClamAV 스캔                                               | M    |
| FR-REQ-06 | 업로드 직후 PHI 패턴 1차 스캔 (정규식: 주민번호·전화번호·이메일·계좌) | M    |
| FR-REQ-07 | 파일은 KMS 암호화 S3 객체로 저장                                      | M    |
| FR-REQ-08 | 파일 접근은 signed URL 15분 만료 + 다운로드 워터마크                  | M    |
| FR-REQ-09 | 의뢰 임시저장 (Draft)                                                 | M    |
| FR-REQ-10 | 의뢰 제출 시 결제 페이지로 이동                                       | M    |
| FR-REQ-11 | 의뢰 상태별 권한 가드 (§8)                                            | M    |
| FR-REQ-12 | 슈퍼바이저는 자기에게 배정된 의뢰의 자료만 접근 가능 (RLS 강제)       | M    |
| FR-REQ-13 | 의뢰별 보관기간 선택 (7/30/90일)                                      | M    |
| FR-REQ-14 | 보관기간 만료 시 자동 삭제 + 사전 알림 (3일 전)                       | M    |
| FR-REQ-15 | 의뢰자가 언제든지 즉시 삭제 요청 가능                                 | M    |

### 7.5 결제·정산 (FR-PAY)

| ID        | 요구사항                                                              | 우선 |
| --------- | --------------------------------------------------------------------- | ---- |
| FR-PAY-01 | 토스페이먼츠 카드·계좌이체                                            | M    |
| FR-PAY-02 | 결제 성공 시 의뢰 `Paid` 상태 전이 + 슈퍼바이저 알림                  | M    |
| FR-PAY-03 | 환불 (전액·부분)                                                      | M    |
| FR-PAY-04 | 슈퍼바이저 정산은 슈퍼비전 완료 + 7일 보류 후 월 2회(15일, 말일) 지급 | M    |
| FR-PAY-05 | 플랫폼 수수료 20% (MVP)                                               | M    |
| FR-PAY-06 | 세금계산서 발급 (사업자 슈퍼바이저 대상) [⚖️ 세무 검토 필요]          | M    |
| FR-PAY-07 | 영수증/거래내역 PDF 다운로드                                          | M    |
| FR-PAY-08 | 정산 명세서 (월별)                                                    | M    |
| FR-PAY-09 | 분쟁 시 보류금 처리 (분쟁 해결 시까지 정산 보류)                      | M    |

### 7.6 슈퍼비전 진행 (FR-SUP)

| ID        | 요구사항                                                                       | 우선 |
| --------- | ------------------------------------------------------------------------------ | ---- |
| FR-SUP-01 | 슈퍼바이저 수락/거절/추가자료 요청                                             | M    |
| FR-SUP-02 | 비동기 코멘트: 인라인 코멘트 + 종합 피드백                                     | M    |
| FR-SUP-03 | 직접 수정: 수정본 파일 업로드 (원본·수정본 함께 보관)                          | M    |
| FR-SUP-04 | Zoom: 슈퍼바이저가 미팅 링크 수동 입력 (회의 1시간 전부터 슈퍼바이지에게 노출) | M    |
| FR-SUP-05 | 슈퍼비전 완료 처리 → 완료 기록서 작성 강제                                     | M    |
| FR-SUP-06 | 1회 무료 추가 질문 (상품별 정책 설정 가능)                                     | S    |
| FR-SUP-07 | 슈퍼바이저가 자료에 PHI 의심 발견 시 "PHI 신고" 버튼                           | M    |

### 7.7 완료 기록·리뷰 (FR-REC)

| ID        | 요구사항                             | 우선 |
| --------- | ------------------------------------ | ---- |
| FR-REC-01 | 완료 기록서 자동 생성 (§15)          | M    |
| FR-REC-02 | 완료 기록서 PDF 다운로드 (양쪽 모두) | M    |
| FR-REC-03 | 구조화 리뷰 9항목 + 자유서술         | M    |
| FR-REC-04 | 리뷰 작성 후 7일간 수정 가능         | S    |
| FR-REC-05 | 리뷰 부적절 발언 신고                | M    |
| FR-REC-06 | 운영팀이 리뷰 비공개 처리 가능       | M    |

### 7.8 알림 (FR-NOTIF)

| ID          | 요구사항                                           | 우선 |
| ----------- | -------------------------------------------------- | ---- |
| FR-NOTIF-01 | 인앱 알림 센터 + 미읽음 카운트                     | M    |
| FR-NOTIF-02 | 이메일 알림 (의뢰명·케이스 정보 미포함, 의뢰 ID만) | M    |
| FR-NOTIF-03 | 알림 채널별 on/off                                 | S    |
| FR-NOTIF-04 | 카카오 알림톡은 v2                                 | —    |

### 7.9 관리자 (FR-ADMIN) — §13에서 상세

---

## 8. 비기능 요구사항 (Non-Functional Requirements)

### 8.1 성능

- 페이지 LCP < 2.5s (3G 환경 기준은 제외, 4G/Wi-Fi)
- API 평균 응답 200ms 이하 (P95 500ms)
- 파일 업로드는 청크 업로드 (200MB까지)
- 파일 다운로드는 signed URL → CloudFront/Supabase CDN

### 8.2 가용성

- 가용성 목표 99.5% (베타), 99.9% (정식)
- 정기 점검: 매주 화요일 03~04시 KST
- DB 일일 자동 백업 + PITR 7일

### 8.3 확장성

- 동시접속 500명 가정으로 설계 (MVP)
- DB는 Supabase Pro Seoul, 필요 시 Read Replica 추가
- 파일 스토리지는 객체 단위 KMS 암호화 → AWS S3 Seoul 또는 Supabase Storage

### 8.4 호환성

- 브라우저: Chrome/Edge/Safari 최신 2버전, Firefox 최신
- 반응형 (≥320px). iOS Safari, Android Chrome 동작 확인
- IE/구버전 미지원

### 8.5 접근성 (WCAG 2.1 AA)

- 폼 label 모두 명시
- 명도 대비 4.5:1
- 키보드 네비게이션
- 스크린리더 호환 (검사명·전문분야 등 의료용어는 한글 설명 병기)

### 8.6 로깅·모니터링

- 모든 API 요청 로깅 (요청자·엔드포인트·결과코드·소요시간)
- 모든 파일 접근 로깅 (열람·다운로드·업로드·삭제)
- 모든 관리자 액션 로깅
- 보안 이벤트(로그인 실패, 권한 위반, PHI 의심 패턴 감지) 별도 채널 알림 (운영팀 Slack/이메일)
- Sentry 등 APM은 PII 마스킹 옵션 활성화 후 도입

### 8.7 국제화

- ko-KR만 (MVP)
- 통화 KRW 고정
- 시간대 Asia/Seoul 고정

---

## 9. 보안·개인정보 요구사항 (Security & Privacy)

> 이 섹션은 본 플랫폼에서 가장 엄격하게 다뤄야 한다. 누락 시 출시 금지.

### 9.1 인증·인가

- **SEC-AUTH-01**: 모든 비밀번호는 Argon2id (또는 bcrypt cost=12+) 해시. 솔트 자동 생성.
- **SEC-AUTH-02**: 관리자 TOTP 2FA 필수. 슈퍼바이저는 권장(설정 안내, 출시 후 정책 강화 가능). 복구 코드 8개 발급.
- **SEC-AUTH-03**: 관리자 IP allowlist 옵션 (운영 정책).
- **SEC-AUTH-04**: 세션 토큰 회전 (매 15분 또는 권한 변경 시).
- **SEC-AUTH-05**: 권한 변경/비밀번호 변경 시 모든 활성 세션 무효화.

### 9.2 접근제어

- **SEC-ACL-01**: RBAC 기반 (`supervisee`, `supervisor`, `admin`).
- **SEC-ACL-02**: 케이스/파일별 ABAC: 소유자(슈퍼바이지) + 배정된 슈퍼바이저 + 관리자만 접근.
- **SEC-ACL-03**: 관리자도 PHI 파일은 별도 "사유 입력" 후 접근, 감사로그 강제.
- **SEC-ACL-04**: 모든 DB 쿼리는 RLS 강제. `BYPASSRLS` 권한은 시스템 마이그레이션 외 사용 금지.
- **SEC-ACL-05**: 슈퍼바이저는 본인 배정 외 의뢰는 메타데이터(검색 결과)조차 접근 불가.

### 9.3 데이터 보호

- **SEC-DATA-01**: 모든 통신 TLS 1.2 이상 (HSTS preload 등록).
- **SEC-DATA-02**: DB 컬럼 단위 암호화 대상: 이름, 연락처, 자격번호, 케이스 제목, 의뢰 사유, 완료 기록서 본문.
- **SEC-DATA-03**: 파일 객체 단위 KMS 암호화. 키 로테이션 연 1회.
- **SEC-DATA-04**: 파일 signed URL 15분 만료, 사용자 IP 바인딩(가능 시).
- **SEC-DATA-05**: 다운로드 PDF에 워터마크 (열람자 이메일·다운로드 시각·의뢰 ID).
- **SEC-DATA-06**: 백업도 암호화. 백업 키는 운영 키와 별도 관리.

### 9.4 입력 검증·취약점

- **SEC-INPUT-01**: 모든 사용자 입력 Zod/Yup 스키마 검증.
- **SEC-INPUT-02**: SQL injection 방지 (Drizzle prepared statements).
- **SEC-INPUT-03**: XSS 방지 (React 자동 escaping + CSP 헤더).
- **SEC-INPUT-04**: CSRF 방지 (Same-Site 쿠키 + double submit token).
- **SEC-INPUT-05**: 파일 업로드는 MIME 화이트리스트 + 매직넘버 검증 + ClamAV 스캔.
- **SEC-INPUT-06**: 파일명 sanitize (경로 조작 방지).
- **SEC-INPUT-07**: 업로드 전 PHI 정규식 1차 스캔 (주민번호 형식, 휴대폰, 이메일, 계좌번호).

### 9.5 비식별화 게이트

- **SEC-DEID-01**: 케이스 제목·의뢰사유 필드는 클라이언트·서버 양쪽에서 PHI 정규식 검사. 매치 시 제출 차단.
- **SEC-DEID-02**: 파일 업로드 전 비식별화 체크리스트 12항목 강제(§10).
- **SEC-DEID-03**: 파일명에 한글 이름 패턴(2~4글자) 감지 시 경고.
- **SEC-DEID-04**: 슈퍼바이저가 자료에서 PHI 발견 시 신고 → 즉시 운영팀 알림 → 의뢰 일시정지.

### 9.6 로깅·감사

- **SEC-LOG-01**: 모든 PHI 접근(파일 열람, 다운로드, 코멘트 작성)은 `audit_logs`에 기록.
- **SEC-LOG-02**: 감사 로그는 별도 테이블 + WORM 정책(수정·삭제 금지).
- **SEC-LOG-03**: 감사 로그 5년 보관 [⚖️ 보관기간 법률 검토 필요].
- **SEC-LOG-04**: 운영자 본인 행동도 동일하게 기록.

### 9.7 동의·약관

- **SEC-CON-01**: 가입 시 약관·개인정보처리방침·민감정보 동의 분리.
- **SEC-CON-02**: 동의서 버전 관리 (변경 시 재동의 강제).
- **SEC-CON-03**: 의뢰 시 케이스별 별도 동의 (내담자·기관 동의 확인 체크).
- **SEC-CON-04**: 만 14세 미만 직접 가입 차단 (슈퍼바이지·슈퍼바이저 모두).

### 9.8 운영

- **SEC-OPS-01**: 운영 직원은 최소 권한 원칙. 자료 접근 시 사유 입력 강제.
- **SEC-OPS-02**: 광고·마케팅 픽셀(Meta, Google Ads, Naver, GTM 등)은 **비임상 페이지에서만 적극 사용**. 비임상 페이지 = 랜딩, 서비스 소개, 가격, 블로그, 슈퍼바이저 검색 결과 페이지(개인 슈퍼바이저 식별정보·케이스 정보 미포함 한정). 임상자료 페이지(케이스 패킷·파일·피드백·완료 기록·예약 상세·관리자 페이지)에는 외부 픽셀·외부 SDK·외부 폰트·외부 분석 트래커 미장착.
- **SEC-OPS-03**: GA4·Mixpanel은 비임상 페이지 한정 적용. 케이스·자료·피드백·기록 페이지에는 트래커 미장착.
- **SEC-OPS-04**: 검색엔진 인덱싱 차단 (`X-Robots-Tag: noindex`) — 케이스 패킷·파일·피드백·완료 기록·관리자 페이지. 슈퍼바이저 프로필 검색 페이지는 SEO 허용(마케팅 자산).
- **SEC-OPS-05**: 알림 메시지에 케이스 제목·내용 미포함(ID·상품명만).
- **SEC-OPS-06**: 개인정보 유출 발생 시 72시간 내 KISA·이용자 통지 [⚖️ 개인정보보호법 §39의4, §34 검토 백로그].

### 9.9 삭제

- **SEC-DEL-01**: 이용자 탈퇴 시 30일 grace period 후 개인정보 영구 삭제 (감사로그·결제기록은 법정 보관기간만 익명화 후 보관).
- **SEC-DEL-02**: 보관기간 만료 자동 삭제 + 사전 알림.
- **SEC-DEL-03**: 즉시 삭제 요청 처리 (24시간 내).

---

## 10. 데이터 모델 (Data Model)

> 모든 테이블 공통: `id (uuid pk)`, `created_at`, `updated_at`, `deleted_at`(soft delete), 가능한 경우 `organization_id`(v2 대비).

### 10.1 핵심 도메인 객체 목록

| 객체                          | 설명                     |
| ----------------------------- | ------------------------ |
| `users`                       | 모든 사용자 공통         |
| `supervisor_profiles`         | 슈퍼바이저 프로필        |
| `supervisee_profiles`         | 슈퍼바이지 프로필        |
| `qualifications`              | 자격 (다중)              |
| `specialty_catalog`           | 전문분야 마스터          |
| `supervisor_specialties`      | 슈퍼바이저-전문분야 매핑 |
| `service_products`            | 슈퍼바이저별 상품        |
| `availability_slots`          | 가능 시간 슬롯           |
| `supervision_requests`        | 슈퍼비전 의뢰            |
| `case_packets`                | 표준 케이스 패킷         |
| `case_files`                  | 업로드 파일              |
| `deidentification_checklists` | 비식별화 체크리스트      |
| `consent_records`             | 동의 기록                |
| `payments`                    | 결제                     |
| `refunds`                     | 환불                     |
| `payouts`                     | 슈퍼바이저 정산          |
| `bookings`                    | Zoom 예약                |
| `feedbacks`                   | 비동기 코멘트            |
| `inline_comments`             | 보고서 인라인 코멘트     |
| `completion_records`          | 슈퍼비전 완료 기록       |
| `reviews`                     | 슈퍼바이지 리뷰          |
| `notifications`               | 알림                     |
| `audit_logs`                  | 감사 로그 (WORM)         |
| `access_logs`                 | 접근 로그                |
| `disputes`                    | 분쟁                     |
| `reports`                     | 신고                     |
| `terms_versions`              | 약관 버전                |
| `deletion_requests`           | 삭제 요청                |

### 10.2 ERD (텍스트)

```
users ──┬── supervisor_profiles ──┬── qualifications
        │                          ├── supervisor_specialties ── specialty_catalog
        │                          ├── service_products
        │                          └── availability_slots
        ├── supervisee_profiles
        └── notifications

supervision_requests ──┬── case_packets ─── case_files
                       │              └── deidentification_checklists
                       ├── consent_records
                       ├── payments ──┬── refunds
                       │              └── payouts
                       ├── bookings
                       ├── feedbacks ─── inline_comments
                       ├── completion_records
                       ├── reviews
                       ├── disputes
                       └── reports

audit_logs ── (참조: actor user_id, target_type, target_id)
access_logs ── (참조: actor user_id, file_id)
terms_versions ── consent_records
deletion_requests ── users / case_files
```

### 10.3 주요 테이블 스키마 (Drizzle 기반 의사 SQL)

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- nullable for social login
  role TEXT NOT NULL CHECK (role IN ('supervisee','supervisor','admin')),
  display_name_enc BYTEA,  -- pgcrypto 암호화
  phone_enc BYTEA,
  totp_secret_enc BYTEA,
  totp_enabled BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  failed_login_count INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','withdrawn')),
  organization_id UUID,  -- v2 대비, nullable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- supervisor_profiles
CREATE TABLE supervisor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  display_name TEXT NOT NULL,  -- 공개 표시명 (실명일 수도 있고 별도일 수도)
  photo_url TEXT,
  headline TEXT,  -- 한줄소개
  bio TEXT,
  years_of_experience INT,
  signature_storage_key TEXT,  -- 슈퍼바이저 서명·도장 이미지 (완료 기록서 첨부용, 옵션)
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected','revoked')),
  verified_at TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'hidden'
    CHECK (visibility IN ('hidden','public','private')),
  avg_response_minutes INT,
  accept_rate NUMERIC(4,3),
  total_completed INT DEFAULT 0,
  average_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- qualifications
CREATE TABLE qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_profile_id UUID NOT NULL REFERENCES supervisor_profiles(id),
  name TEXT NOT NULL,  -- 예: '임상심리전문가'
  number_enc BYTEA,    -- 자격번호 암호화
  issuing_body TEXT,
  issued_at DATE,
  expires_at DATE,
  evidence_file_id UUID,  -- 자격증 사본 (별도 버킷)
  verification_note TEXT, -- 운영팀 메모
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- specialty_catalog (운영팀 관리)
CREATE TABLE specialty_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,  -- e.g. 'adult_psychopathology'
  label_ko TEXT NOT NULL,     -- '성인 정신병리'
  parent_id UUID REFERENCES specialty_catalog(id),
  display_order INT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE supervisor_specialties (
  supervisor_profile_id UUID REFERENCES supervisor_profiles(id),
  specialty_id UUID REFERENCES specialty_catalog(id),
  PRIMARY KEY (supervisor_profile_id, specialty_id)
);

-- service_products
CREATE TABLE service_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_profile_id UUID NOT NULL REFERENCES supervisor_profiles(id),
  kind TEXT NOT NULL CHECK (kind IN ('async_comment','async_direct_edit','zoom_60','zoom_90','urgent_24h')),
  title TEXT NOT NULL,
  description TEXT,
  price_krw INT NOT NULL CHECK (price_krw >= 10000),
  turnaround_hours INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- availability_slots
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_profile_id UUID NOT NULL REFERENCES supervisor_profiles(id),
  weekday SMALLINT CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'Asia/Seoul'
);

-- supervision_requests
CREATE TABLE supervision_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisee_id UUID NOT NULL REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),  -- 매칭 전까지 nullable
  service_product_id UUID REFERENCES service_products(id),
  status TEXT NOT NULL CHECK (status IN (
    'draft','submitted','awaiting_payment','paid','awaiting_supervisor_review',
    'accepted','rejected','additional_info_requested','in_review',
    'feedback_submitted','meeting_scheduled','meeting_completed',
    'completion_record_issued','completed','cancelled','refunded','expired','deleted'
  )),
  retention_days INT NOT NULL CHECK (retention_days IN (7,30,90)),
  retention_expires_at TIMESTAMPTZ,
  urgency TEXT CHECK (urgency IN ('normal','urgent_24h')),
  desired_deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- case_packets
CREATE TABLE case_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL UNIQUE REFERENCES supervision_requests(id),
  title_enc BYTEA NOT NULL,
  purpose JSONB,  -- ['differential_diagnosis','report_quality',...]
  client_age_band TEXT,  -- '6-12','13-18','19-39','40-64','65+'
  client_gender TEXT,
  setting TEXT,  -- 'hospital','counseling_center','community_center','school','other'
  chief_complaint_enc BYTEA,
  referral_reason_enc BYTEA,
  tests_used JSONB,  -- ['MMPI-2','K-WAIS-IV',...]
  request_items JSONB,  -- ['diagnostic_hypothesis_review',...]
  preferred_method TEXT CHECK (preferred_method IN ('async_comment','direct_edit','zoom','comment_plus_zoom')),
  needs_completion_record BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- case_files
CREATE TABLE case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_packet_id UUID NOT NULL REFERENCES case_packets(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN (
    'report_draft','test_result','scoring_sheet','response_sheet',
    'behavioral_observation','interview_summary','other','direct_edit_revision'
  )),
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  storage_key TEXT NOT NULL,  -- S3 key
  kms_key_id TEXT,
  checksum_sha256 TEXT,
  virus_scan_status TEXT CHECK (virus_scan_status IN ('pending','clean','infected','error')),
  phi_scan_status TEXT CHECK (phi_scan_status IN ('pending','clean','suspicious')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  retention_expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- deidentification_checklists
CREATE TABLE deidentification_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_packet_id UUID NOT NULL UNIQUE REFERENCES case_packets(id),
  -- 12개 항목 각각 boolean
  removed_name BOOLEAN NOT NULL,
  removed_rrn BOOLEAN NOT NULL,
  removed_phone BOOLEAN NOT NULL,
  removed_address BOOLEAN NOT NULL,
  removed_guardian_name BOOLEAN NOT NULL,
  removed_org_name BOOLEAN NOT NULL,
  removed_chart_number BOOLEAN NOT NULL,
  filename_safe BOOLEAN NOT NULL,
  raw_data_safe BOOLEAN NOT NULL,
  minimal_info BOOLEAN NOT NULL,
  client_consent_confirmed BOOLEAN NOT NULL,
  purpose_understood BOOLEAN NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_by UUID REFERENCES users(id)
);

-- consent_records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  terms_version_id UUID NOT NULL REFERENCES terms_versions(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('tos','privacy','sensitive','marketing')),
  consented BOOLEAN NOT NULL,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL REFERENCES supervision_requests(id),
  amount_krw INT NOT NULL,
  platform_fee_krw INT NOT NULL,
  supervisor_net_krw INT NOT NULL,
  pg_provider TEXT NOT NULL DEFAULT 'toss',
  pg_payment_key TEXT,
  pg_order_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','partially_refunded','refunded','cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  amount_krw INT NOT NULL,
  reason TEXT,
  initiated_by UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('requested','approved','rejected','completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES users(id),
  period_start DATE,
  period_end DATE,
  gross_krw INT,
  platform_fee_krw INT,
  net_krw INT,
  status TEXT CHECK (status IN ('scheduled','held','paid','failed')),
  scheduled_at DATE,
  paid_at TIMESTAMPTZ
);

-- bookings (Zoom)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL UNIQUE REFERENCES supervision_requests(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  meeting_url_enc BYTEA,  -- 회의 1시간 전부터 슈퍼바이지에 노출
  status TEXT CHECK (status IN ('scheduled','rescheduled','cancelled','completed','no_show_supervisee','no_show_supervisor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- feedbacks (비동기 종합 피드백)
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL REFERENCES supervision_requests(id),
  supervisor_id UUID NOT NULL REFERENCES users(id),
  summary_enc BYTEA,
  recommendations_enc BYTEA,
  submitted_at TIMESTAMPTZ
);

-- inline_comments (보고서 페이지·단락 단위)
CREATE TABLE inline_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id),
  target_file_id UUID REFERENCES case_files(id),
  anchor JSONB,  -- {page, paragraph, char_range}
  comment_enc BYTEA,
  severity TEXT CHECK (severity IN ('info','suggestion','warning','critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- completion_records
CREATE TABLE completion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL UNIQUE REFERENCES supervision_requests(id),
  record_no TEXT UNIQUE NOT NULL,  -- 'CR-2026-000001'
  supervisor_id UUID NOT NULL REFERENCES users(id),
  supervisee_id UUID NOT NULL REFERENCES users(id),
  supervisor_qualification_snapshot JSONB,
  reviewed_materials JSONB,
  scope JSONB,
  limitations_enc BYTEA,
  responsibility_notice TEXT,  -- 고정 문구 + 슈퍼바이저 가감 (가감분은 책임범위 한정)
  signature_storage_key TEXT,  -- 발급 시점 서명·도장 이미지 스냅샷 (supervisor_profiles에서 복사)
  signature_attached_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_storage_key TEXT
);

-- reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL UNIQUE REFERENCES supervision_requests(id),
  supervisor_id UUID NOT NULL REFERENCES users(id),
  supervisee_id UUID NOT NULL REFERENCES users(id),
  expertise SMALLINT CHECK (expertise BETWEEN 1 AND 5),
  specificity SMALLINT CHECK (specificity BETWEEN 1 AND 5),
  helpfulness SMALLINT CHECK (helpfulness BETWEEN 1 AND 5),
  ethics SMALLINT CHECK (ethics BETWEEN 1 AND 5),
  response_speed SMALLINT CHECK (response_speed BETWEEN 1 AND 5),
  on_time SMALLINT CHECK (on_time BETWEEN 1 AND 5),
  educational SMALLINT CHECK (educational BETWEEN 1 AND 5),
  reuse_intent SMALLINT CHECK (reuse_intent BETWEEN 1 AND 5),
  free_text TEXT,
  status TEXT DEFAULT 'visible' CHECK (status IN ('visible','hidden','reported')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  payload JSONB,  -- 절대 PHI 포함 금지
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs (WORM, 감사용)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,  -- e.g. 'case_file.read','admin.refund.approve'
  target_type TEXT,
  target_id UUID,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- INSERT only. UPDATE/DELETE는 트리거로 차단.

-- access_logs (파일 접근 전용)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_id UUID NOT NULL,
  action TEXT CHECK (action IN ('view','download','upload','delete')),
  ip_address TEXT,
  signed_url_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id UUID NOT NULL REFERENCES supervision_requests(id),
  raised_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  description_enc BYTEA,
  status TEXT CHECK (status IN ('open','investigating','resolved_refund','resolved_partial','resolved_denied','closed')),
  resolution_note TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reports (리뷰·메시지 신고)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID,
  target_type TEXT,
  target_id UUID,
  reason TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- terms_versions
CREATE TABLE terms_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT CHECK (kind IN ('tos','privacy','sensitive','marketing')),
  version TEXT NOT NULL,
  content_md TEXT,
  effective_from DATE,
  is_active BOOLEAN DEFAULT TRUE
);

-- deletion_requests
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID,
  target_type TEXT CHECK (target_type IN ('user','case_file','case_packet','supervision_request')),
  target_id UUID,
  reason TEXT,
  status TEXT CHECK (status IN ('pending','approved','rejected','completed')),
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.4 인덱스 (필수)

- `users(email)`
- `supervisor_profiles(visibility, verification_status)`
- `supervisor_specialties(specialty_id)`
- `supervision_requests(supervisee_id, status)`
- `supervision_requests(supervisor_id, status)`
- `case_files(case_packet_id)`, `case_files(retention_expires_at)` partial WHERE deleted_at IS NULL
- `payments(supervision_request_id, status)`
- `audit_logs(actor_user_id, created_at)`, `audit_logs(target_type, target_id)`
- `access_logs(file_id, created_at)`

### 10.5 RLS 정책 (요약)

- 모든 PHI 테이블 `FORCE ROW LEVEL SECURITY`.
- `current_setting('app.current_user_id')` GUC 기반 정책.
- 예: `case_files` SELECT 정책: 소유 케이스의 슈퍼바이지 OR 배정된 슈퍼바이저 OR 관리자(사유 입력).
- 관리자 권한은 별도 `app.admin_reason` GUC가 세션에 설정된 경우에만 활성.

---

## 11. API 설계 (REST + Server Actions)

> Next.js App Router 기준. 인증 후 모든 요청은 `withOrgContext` 미들웨어를 거친다. 응답은 `{ data, error }` 봉투 패턴.

### 11.1 공통 규칙

- Base path: `/api/v1`
- 인증: 쿠키 세션 + CSRF 토큰 헤더
- 에러: HTTP 표준 코드 + `error.code`(서비스 코드) + `error.message`(사용자 표시 가능)
- Rate limit: 인증 60req/min, 비인증 20req/min, 로그인 시도 5/15분
- 모든 PHI 응답은 마스킹 옵션 (`?mask=true` 미사용 시 권한 가드 다시 체크)

### 11.2 Auth

| Method | Endpoint                       | 설명                        | 권한            |
| ------ | ------------------------------ | --------------------------- | --------------- |
| POST   | `/auth/signup`                 | 가입 (역할·약관동의)        | public          |
| POST   | `/auth/login`                  | 로그인 (2FA 단계 진입 가능) | public          |
| POST   | `/auth/2fa/verify`             | 2FA 코드 검증               | session pending |
| POST   | `/auth/logout`                 | 로그아웃                    | authed          |
| POST   | `/auth/password/reset-request` | 재설정 메일                 | public          |
| POST   | `/auth/password/reset`         | 토큰으로 재설정             | public          |
| GET    | `/auth/me`                     | 내 정보                     | authed          |

### 11.3 Users / Profiles

| Method | Endpoint                                       | 설명                       | 권한          |
| ------ | ---------------------------------------------- | -------------------------- | ------------- |
| GET    | `/users/me`                                    | 내 프로필                  | authed        |
| PATCH  | `/users/me`                                    | 기본 정보 수정             | authed        |
| POST   | `/users/me/withdraw`                           | 탈퇴 요청                  | authed        |
| POST   | `/users/me/2fa/enable`                         | TOTP 등록                  | authed        |
| GET    | `/supervisor-profiles`                         | 검색 (필터·페이지네이션)   | public/authed |
| GET    | `/supervisor-profiles/:id`                     | 상세                       | public/authed |
| POST   | `/supervisor-profiles`                         | 슈퍼바이저 프로필 생성     | supervisor    |
| PATCH  | `/supervisor-profiles/:id`                     | 수정 (자격 수정 시 재검증) | supervisor    |
| POST   | `/supervisor-profiles/:id/submit-verification` | 검증 요청                  | supervisor    |

### 11.4 Qualifications / Specialties / Products

| Method | Endpoint                      | 설명                       |
| ------ | ----------------------------- | -------------------------- |
| POST   | `/qualifications`             | 자격 추가 (증빙 파일 포함) |
| DELETE | `/qualifications/:id`         | 삭제 (소유자)              |
| GET    | `/specialty-catalog`          | 전문분야 목록 (public)     |
| POST   | `/service-products`           | 상품 등록                  |
| PATCH  | `/service-products/:id`       | 수정                       |
| DELETE | `/service-products/:id`       | 비활성 처리                |
| GET    | `/availability/:supervisorId` | 가능 슬롯 조회             |
| PUT    | `/availability`               | 슬롯 일괄 갱신             |

### 11.5 Supervision Requests

| Method | Endpoint                                       | 설명                           |
| ------ | ---------------------------------------------- | ------------------------------ |
| POST   | `/supervision-requests`                        | 의뢰 생성 (Draft)              |
| GET    | `/supervision-requests/mine`                   | 내 의뢰 목록                   |
| GET    | `/supervision-requests/:id`                    | 상세 (권한별 시야)             |
| PATCH  | `/supervision-requests/:id`                    | Draft 수정                     |
| POST   | `/supervision-requests/:id/submit`             | 제출 → 결제 단계               |
| POST   | `/supervision-requests/:id/cancel`             | 취소 (Draft·AwaitingPayment만) |
| POST   | `/supervision-requests/:id/accept`             | 슈퍼바이저 수락                |
| POST   | `/supervision-requests/:id/reject`             | 슈퍼바이저 거절                |
| POST   | `/supervision-requests/:id/request-additional` | 추가자료 요청                  |
| POST   | `/supervision-requests/:id/complete`           | 슈퍼바이지 완료 처리           |
| POST   | `/supervision-requests/:id/dispute`            | 분쟁 신고                      |

**보안 체크**: 모든 엔드포인트는 (a) 본인 또는 배정된 슈퍼바이저 또는 관리자, (b) 상태별 허용 액션, (c) 비활성 슈퍼바이저 차단.

### 11.6 Case Packets / Files

| Method | Endpoint                                 | 설명                          |
| ------ | ---------------------------------------- | ----------------------------- |
| POST   | `/case-packets`                          | 패킷 생성 (의뢰와 1:1)        |
| PATCH  | `/case-packets/:id`                      | 수정                          |
| POST   | `/case-packets/:id/deidentification-ack` | 체크리스트 확인               |
| POST   | `/case-files/upload-url`                 | 업로드용 presigned URL 요청   |
| POST   | `/case-files`                            | 업로드 완료 등록 (S3 키·메타) |
| GET    | `/case-files/:id/download-url`           | 다운로드용 signed URL (15분)  |
| DELETE | `/case-files/:id`                        | 즉시 삭제 요청                |

**업로드 흐름**: 클라이언트 → `/case-files/upload-url` → S3 직접 PUT → 클라이언트 → `/case-files` 등록 → 서버가 ClamAV·PHI 스캔 잡 큐잉.

### 11.7 Payments

| Method | Endpoint               | 설명                                          |
| ------ | ---------------------- | --------------------------------------------- |
| POST   | `/payments/intent`     | 토스 결제 키 발급 (의뢰 ID)                   |
| POST   | `/payments/confirm`    | 결제 승인 콜백                                |
| POST   | `/payments/:id/refund` | 환불 (운영자/슈퍼바이저 자동/슈퍼바이지 분쟁) |
| GET    | `/payments/mine`       | 내 결제 내역                                  |
| GET    | `/payouts/mine`        | 슈퍼바이저 정산 내역                          |

### 11.8 Bookings

| Method | Endpoint                   | 설명                                |
| ------ | -------------------------- | ----------------------------------- |
| POST   | `/bookings`                | 슬롯 예약                           |
| PATCH  | `/bookings/:id/reschedule` | 변경 (24시간 전까지)                |
| POST   | `/bookings/:id/zoom-link`  | 슈퍼바이저 링크 입력 (암호화 저장)  |
| GET    | `/bookings/:id/zoom-link`  | 슈퍼바이지가 회의 1시간 전부터 조회 |
| POST   | `/bookings/:id/cancel`     | 취소 (정책별 환불)                  |

### 11.9 Feedback / Completion / Review

| Method | Endpoint                      | 설명                    |
| ------ | ----------------------------- | ----------------------- |
| POST   | `/feedbacks`                  | 종합 피드백 작성        |
| POST   | `/inline-comments`            | 인라인 코멘트 추가      |
| POST   | `/completion-records`         | 완료 기록서 발급        |
| GET    | `/completion-records/:id.pdf` | PDF 다운로드 (서명 URL) |
| POST   | `/reviews`                    | 리뷰 작성               |
| POST   | `/reviews/:id/report`         | 리뷰 신고               |

### 11.10 Notifications

| Method | Endpoint                     | 설명                     |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/notifications`             | 목록 (커서 페이지네이션) |
| POST   | `/notifications/:id/read`    | 읽음 처리                |
| PATCH  | `/notifications/preferences` | 채널 on/off              |

### 11.11 Admin (모두 `admin` 역할 + IP allowlist)

| Method | Endpoint                               | 설명                           |
| ------ | -------------------------------------- | ------------------------------ |
| GET    | `/admin/users`                         | 사용자 검색                    |
| POST   | `/admin/users/:id/suspend`             | 정지                           |
| GET    | `/admin/verifications`                 | 검증 큐                        |
| POST   | `/admin/verifications/:id/approve`     | 승인                           |
| POST   | `/admin/verifications/:id/reject`      | 반려 (사유)                    |
| GET    | `/admin/supervision-requests`          | 모든 의뢰 (PHI는 사유 입력 후) |
| POST   | `/admin/case-files/:id/access`         | PHI 접근 (사유 강제)           |
| GET    | `/admin/refunds`                       | 환불 큐                        |
| POST   | `/admin/refunds/:id/decision`          | 승인·반려                      |
| GET    | `/admin/disputes`                      | 분쟁 큐                        |
| POST   | `/admin/disputes/:id/resolve`          | 처리                           |
| GET    | `/admin/deletion-requests`             | 삭제 요청                      |
| POST   | `/admin/deletion-requests/:id/process` | 처리                           |
| GET    | `/admin/audit-logs`                    | 감사 로그 (필터)               |
| GET    | `/admin/access-logs`                   | 접근 로그                      |
| GET    | `/admin/stats`                         | 통계                           |
| POST   | `/admin/terms`                         | 약관 버전 등록                 |
| POST   | `/admin/specialty-catalog`             | 카테고리 관리                  |

### 11.12 공통 실패 케이스

- 401 `auth_required`
- 403 `forbidden` / `phi_access_reason_required` / `2fa_required`
- 404 `not_found`
- 409 `state_transition_invalid` / `version_conflict`
- 422 `validation_error` / `deidentification_incomplete` / `phi_detected`
- 429 `rate_limited`
- 451 `file_quarantined` (악성·PHI)
- 500 `internal_error`

---

## 12. 화면 목록 및 설명

### 12.1 공통 화면

| 화면               | 핵심 컴포넌트                                | 비고    |
| ------------------ | -------------------------------------------- | ------- |
| 랜딩               | 서비스 소개·CTA(초청코드 입력)·보안 안내·FAQ | noindex |
| 서비스 소개        | 프로세스 다이어그램·책임범위 안내            |         |
| 가격 안내          | 상품 종류·플랫폼 수수료 안내                 |         |
| 보안/개인정보 안내 | KMS·RLS·삭제 정책 요약                       |         |
| 로그인             | 이메일·비밀번호·소셜(카카오)·2FA             |         |
| 회원가입           | 역할 선택·약관 3종 분리 동의·이메일 인증     |         |
| 비밀번호 재설정    | 이메일 토큰                                  |         |
| 마이페이지         | 기본정보·2FA·세션·동의이력·탈퇴              |         |
| 알림센터           | 인앱 알림 리스트·필터                        |         |
| 도움말/문의        | 운영팀 문의 채널                             |         |

### 12.2 슈퍼바이지 화면

| 화면                              | 핵심 컴포넌트                                                             | 예외                     |
| --------------------------------- | ------------------------------------------------------------------------- | ------------------------ |
| 슈퍼바이지 대시보드               | 진행 중 의뢰·미응답 카드·최근 알림                                        | 신규 사용자 온보딩 카드  |
| 슈퍼바이저 검색                   | 전문분야 체크박스(다중) + 키워드 검색 + 정렬 + 카드 그리드 + 페이지네이션 | 검증된 슈퍼바이저만 노출 |
| 슈퍼바이저 상세                   | 프로필·자격·상품·가능시간·리뷰                                            | 상품 선택 CTA            |
| 의뢰 신청 (1) 상품 확인           | 상품·가격·turnaround                                                      |                          |
| 의뢰 신청 (2) 케이스 패킷         | 제목·목적·연령·검사·요청사항·희망마감                                     | PHI 정규식 차단          |
| 의뢰 신청 (3) 비식별화 체크리스트 | 12 체크 + 경고 패턴                                                       | 미완료 시 다음 단계 잠금 |
| 의뢰 신청 (4) 파일 업로드         | 드래그·업로드 진행률·스캔 상태·삭제                                       | 검사 실패 시 차단        |
| 의뢰 신청 (5) 동의·결제           | 약관·민감정보 동의·결제수단·보관기간                                      | 결제 실패 처리           |
| 내 의뢰 목록                      | 상태 필터·검색                                                            | PHI 미노출               |
| 의뢰 상세                         | 상태·자료·피드백·완료기록·리뷰 작성 CTA                                   | 상태별 액션 가드         |
| 피드백 확인                       | 인라인 + 종합 + 답변 작성                                                 |                          |
| 완료 기록서 보기                  | PDF 미리보기·다운로드                                                     |                          |
| 리뷰 작성                         | 9항목 + 자유서술                                                          | 작성 후 7일 수정 가능    |
| 파일 즉시 삭제 요청               | 사유 입력                                                                 |                          |

### 12.3 슈퍼바이저 화면

| 화면                         | 핵심 컴포넌트                                              |
| ---------------------------- | ---------------------------------------------------------- |
| 슈퍼바이저 대시보드          | 미응답 의뢰·진행 중·완료·정산 요약                         |
| 프로필 작성/수정             | 단계형 폼 (기본·자격·전문·소개·상품·일정)                  |
| 자격 검증 제출               | 자격증 사본 업로드·진행 상태                               |
| 의뢰 목록                    | 상태 필터·새 의뢰 강조                                     |
| 의뢰 상세 (자료 미공개 단계) | 메타데이터만·수락/거절 CTA                                 |
| 의뢰 상세 (자료 공개)        | 파일 뷰어·인라인 코멘트·종합 피드백·추가자료 요청·PHI 신고 |
| 완료 기록서 작성             | 검토 자료 선택·범위·제한점·책임범위 문구                   |
| 정산 내역                    | 월별·상태                                                  |
| 리뷰 확인                    | 통계·자유서술                                              |

### 12.4 관리자 화면

| 화면               | 핵심 컴포넌트                              |
| ------------------ | ------------------------------------------ |
| 관리자 로그인      | 2FA + IP 체크                              |
| 대시보드           | 일일 지표·미처리 큐                        |
| 회원 관리          | 검색·상세·정지/탈퇴                        |
| 자격 검증 큐       | 신청·증빙·승인/반려                        |
| 의뢰 모니터링      | 상태 분포·체류시간·PHI 접근 사유 입력 강제 |
| 결제/환불          | 검색·환불 승인                             |
| 정산               | 월 정산 산출·지급                          |
| 신고/분쟁          | 큐·증거·결정                               |
| 개인정보 삭제 요청 | 큐·처리·로그                               |
| 접근 로그          | 사용자·파일·기간 필터                      |
| 보안 이벤트        | 로그인 실패·권한 위반·PHI 탐지             |
| 약관 관리          | 버전 등록·발효일                           |
| 카테고리 관리      | 전문분야 트리                              |
| 공지사항           | CRUD                                       |
| 통계               | 매출·전환·만족도·반응시간                  |

---

## 13. 관리자 기능 상세

### 13.1 자격 검증 워크플로우

- 큐 정렬: 제출 오래된 순, SLA 5영업일.
- 화면 구성: 자격 카드(자격명·번호·기관·발급일·만료일·증빙 파일), 외부 검증 결과 메모란, 결정(승인/반려/추가자료).
- 승인 시: `supervisor_profiles.verification_status='approved'`, 자동 알림.
- 반려 시: 사유 필수, 슈퍼바이저에게 알림(템플릿화).
- 모든 결정은 `audit_logs`에 actor·target·reason 기록.

### 13.2 PHI 접근 컨트롤

- 관리자가 케이스 자료에 접근 시: 모달에서 사유 입력(최소 30자) 강제 → `app.admin_reason` GUC 설정 후 RLS 통과 → 접근 후 `access_logs` + `audit_logs` 동시 기록.

### 13.3 환불·분쟁 처리

- 표준 SOP를 화면에 명시 (예: 슈퍼바이저 노쇼는 전액 환불 + 페널티 1점).
- 결정 시 PG 환불 API 호출, 정산 보류분에서 차감 또는 플랫폼 부담.
- 분쟁 종결 후에도 자료는 분쟁 기록 보관기간 동안 격리 보관 [⚖️ 보관기간 법률 검토].

### 13.4 삭제 요청 처리

- 사용자 요청은 24시간 SLA, 관리자 검증 후 hard delete (스토리지·DB).
- 단, 법정 보관 의무 자료(결제 거래 기록 5년 등 [⚖️ 전자상거래법 §6])는 익명화 후 보관.

### 13.5 통계 대시보드

- 일·주·월 단위.
- 의뢰 수, 결제율, 환불률, 매칭 성공률, 평균 응답시간, 완료율, 평균 평점, 보관기간 만료 자동삭제 건수, 보안 이벤트 수.
- PHI는 절대 노출하지 않음.

---

## 14. 결제/정산 구조

### 14.1 상품 가이드 가격대 (운영팀 권장)

- 비대면 슈퍼비전(코멘트형): 80,000~120,000원
- 비대면 슈퍼비전(직접수정형): 150,000~250,000원
- 비대면 슈퍼비전(회의형, 60분): 100,000~180,000원
- 비대면 슈퍼비전(회의형, 90분): 150,000~250,000원
- 긴급 24시간: 기본가 +30~50%

### 14.2 수수료

- 플랫폼 수수료: 20% (MVP 고정. v2에서 동적 정책)
- PG 수수료: 약 2.9% — 플랫폼 부담
- 슈퍼바이저 정산: 결제액 × 80% (PG 수수료 별도)

### 14.3 정산 주기

- 슈퍼비전 완료 + 7일 보류(분쟁 대응) → 매월 15일·말일 일괄 지급.
- 보류금: 분쟁 발생 시 분쟁 종결 시까지 동결.

### 14.4 세금·전자세금계산서

- 슈퍼바이저가 사업자(프리랜서 면세사업자 포함)인지 자기신고 → 사업자등록증 사본 업로드 → 자동 세금계산서 발행 [⚖️ 세무사 검토 필요].
- 일반 개인 슈퍼바이저는 3.3% 사업소득세 원천징수 후 지급 [⚖️ 세무사 검토 필요].

### 14.5 환불 정책

| 케이스                               | 환불                      |
| ------------------------------------ | ------------------------- |
| 슈퍼바이저 거절                      | 100%                      |
| 슈퍼바이저 24시간 무응답 후 자동취소 | 100%                      |
| 슈퍼바이지 의뢰 후 작업 시작 전 취소 | 100%                      |
| 작업 시작 후 슈퍼바이지 단순 취소    | 50%                       |
| 슈퍼바이저 노쇼 (Zoom)               | 100% + 다음 슬롯 25% 할인 |
| 슈퍼바이지 노쇼                      | 0%                        |
| 분쟁 인용                            | 사안별 100/50/0           |

### 14.6 노쇼·페널티

- 슈퍼바이저 24h+ 무응답: 응답률 통계에 가중 반영
- 슈퍼바이저 노쇼 3회: 30일 일시정지 → 운영팀 면담
- 슈퍼바이지 노쇼 3회: 결제 시 선예치 100% 요구 (v2)

---

## 15. 슈퍼비전 완료 기록서 (Completion Record)

> 한국 임상 관행상 슈퍼비전 후 슈퍼바이저가 자기 이름·자격·서명·도장을 첨부하는 것은 자연스러운 절차다. 본 플랫폼은 이 관행을 그대로 지원하되, 외부 기관 제출 시의 효력 오해(자격사칭·면허 보증 등)를 차단하는 책임범위 고정 문구를 함께 표시한다.

### 15.1 발급 트리거

- 의뢰 상태가 `feedback_submitted` 또는 `meeting_completed` 이후 슈퍼바이저가 수동 발급.
- 미발급 7일 경과 시 운영팀 알림.

### 15.2 필드

1. 기록서 일련번호 `CR-YYYY-NNNNNN`
2. 의뢰 ID
3. 슈퍼바이지 표시명 (이름은 본인 의사로 노출/비노출 선택, 기본은 비노출 + 의뢰 ID)
4. 슈퍼바이저 표시명
5. 슈퍼바이저 자격 스냅샷 (자격명·발급기관, 자격번호는 마지막 4자리만)
6. 검토 일시·소요 시간(분 단위)
7. 슈퍼비전 방식 (코멘트형/직접수정형/비대면 회의형)
8. 검토 자료 목록 (파일명은 마스킹, 종류만)
9. 검토 범위 (체크박스 + 슈퍼바이저 추가 기술)
10. 주요 피드백 영역 (요약 — PHI 미포함)
11. 제한점 (슈퍼바이저 기술)
12. **슈퍼바이저 서명·도장 첨부 영역** (옵션 — 한국 임상 관행 반영). 슈퍼바이저가 미리 등록한 서명/도장 이미지 또는 기록서 발급 시 즉시 업로드. 단, "검토 범위 내 슈퍼비전 제공 사실의 확인"으로 한정됨을 라벨로 명시.
13. 책임범위 고정 문구 (수정 불가): "본 기록서는 명시된 검토 범위와 일시에 슈퍼비전이 제공되었음을 확인하는 문서이며, 의뢰자가 작성한 최종 보고서·치료기록 전체의 임상적·법적 책임은 의뢰자에게 있습니다. 본 기록서는 슈퍼바이저의 면허·자격에 의한 외부 기관 제출용 검증·승인·보증을 의미하지 않습니다."
14. 자료 보관기간(슈퍼바이지가 선택한 값)
15. 발급일·플랫폼 검증 문구
16. PDF 다운로드 (양측 모두)

### 15.3 PDF 양식 주의

- 발급 후 PDF는 변경 불가, 발급 취소 시 운영자만 사유 입력 후 무효 처리.
- 서명·도장이 첨부되더라도 PDF 마지막 페이지에 §15.2.13 책임범위 고정 문구가 동일 폰트 크기로 출력되어야 한다.

### 15.4 ⚖️ 법률 검토 백로그

- 외부 기관(법원·병무청·산재공단 등) 제출 시 본 기록서가 어떤 효력으로 해석될 수 있는지 변호사 자문.
- "슈퍼비전 사실의 확인" 표현이 의료법·정신건강복지법·자격기본법상 자격사칭 우려와 충돌하지 않는지 검토.
- 변호사 의견에 따라 책임범위 고정 문구 v2 업데이트.

---

## 16. 운영정책 (초안)

> 모든 정책은 출시 전 [⚖️ 법률 검토 필요].

1. **자격 검증 정책**: 자격증 사본+신분증 확인. 자격 유효기간 확인. 만료 자격은 검증 거절. 임상심리전문가/정신건강임상심리사 1급/상담심리사 1급/임상심리수련감독자 우선.
2. **수락/거절 정책**: 24시간 내 응답 권장. 거절 시 사유 분류 필수. 페널티 없음.
3. **환불 정책**: §14.5.
4. **노쇼 정책**: §14.6.
5. **긴급 검토 정책**: 24시간 turnaround. 슈퍼바이저가 가능한 경우만 활성. 미완료 시 자동 일반 검토로 전환 + 차액 환불.
6. **부적절한 자료 처리**: PHI 의심 발견 시 즉시 의뢰 일시정지. 슈퍼바이지에게 재업로드 안내. 1회 경고 후 반복 시 계정 정지.
7. **개인정보 포함 파일**: 자동 격리 + 슈퍼바이저 접근 차단. 운영팀 검토 후 처리.
8. **리뷰 정책**: 인신공격·개인정보 노출·자격 비방 금지. 신고 시 24시간 내 검토.
9. **분쟁 처리**: §11.5의 SOP 화면화.
10. **보관·삭제 정책**: §9.9.
11. **신고 처리 정책**: SLA 24시간 1차 답변.
12. **정산 정책**: §14.
13. **책임범위 고지**: §15.2.12 문구 + 약관·각 의뢰 단계 노출.
14. **법률 검토 필요 항목**: §부록 B.

---

## 17. MVP 개발 일정 (8주)

> 1인~2인 풀스택 + 디자이너 0.5인 + 운영 0.5인 기준. 일정 단축이 우선이면 디자인은 shadcn/ui 기반으로 한정.

### Week 1 — 기반·요구사항 확정

- 정보구조(IA)·와이어프레임 1차
- DB 스키마 v0 확정, ERD 동결
- 보안 정책 확정 (§9)
- Next.js 15 모노레포 (`apps/web`, `apps/admin`, `packages/db`, `packages/shared`)
- Supabase Seoul 프로젝트 생성, KMS 정책
- 토스페이먼츠 가맹 신청 시작 (영업일 소요)
- **산출물**: `drizzle/0000_init.sql`, ERD 다이어그램, IA 문서

### Week 2 — 인증/권한/기본 사용자

- Better-Auth 또는 자체 세션 + Argon2id
- 회원가입(역할·약관)·이메일 인증·로그인·2FA
- 마이페이지 기본
- RLS 정책 v0
- **산출물**: 가입→로그인→2FA 통합 E2E 그린

### Week 3 — 슈퍼바이저 프로필·검색

- 슈퍼바이저 프로필 CRUD
- 자격 등록·자격증 업로드(별도 버킷)
- 전문분야 마스터·매핑
- 검색 페이지 + 필터
- 자격 검증 큐(관리자)
- **산출물**: 검색→상세→상품 보기 가능

### Week 4 — 케이스 패킷·파일 업로드

- 표준 케이스 패킷 폼
- 비식별화 체크리스트 게이트
- presigned URL 업로드 → ClamAV + PHI 정규식 잡
- 다운로드 워터마크 PDF
- **산출물**: 의뢰 Draft 생성·파일 업로드 가능. 게이트 동작 확인.

### Week 5 — 결제·예약

- 토스페이먼츠 통합 (intent·confirm·refund 웹훅)
- 의뢰 상태 머신 구현 (`AwaitingPayment`→`Paid`)
- 가능시간·예약·미팅 링크 입력
- 환불 흐름
- **산출물**: 결제 성공/실패·환불 시나리오 E2E

### Week 6 — 슈퍼비전 진행·완료 기록·리뷰

- 슈퍼바이저 수락/거절/추가자료
- 인라인 코멘트·종합 피드백
- 직접 수정 파일 업로드
- 완료 기록서 발급 + PDF
- 리뷰 9항목
- **산출물**: 플로우 A 처음부터 끝까지 가능

### Week 7 — 관리자·로그·삭제

- 관리자 대시보드 핵심 (자격검증·의뢰·결제·환불·삭제·로그·통계)
- `audit_logs` WORM 트리거
- 보관기간 자동삭제 잡 (cron)
- 알림 시스템 (인앱·이메일)
- **산출물**: 관리자 핸드오버 가능. 자동삭제 점검.

### Week 8 — QA·보안 점검·파일럿

- 보안 점검 체크리스트 (§18) — 임상자료 페이지에 외부 픽셀 미장착 검증 포함
- 펜테스트 1차 (외주 또는 사내)
- 약관·개인정보처리방침·민감정보 동의서 v1 초안 (변호사 자문은 출시 후 백로그 트랙)
- 파일럿 슈퍼바이저 5명 자격검증·온보딩
- 파일럿 슈퍼바이지 10명 초청코드 발송
- **산출물**: 비공개 파일럿 운영 시작

---

## 18. QA 및 테스트 계획

### 18.1 테스트 종류

- **Unit**: 도메인 로직 (상태 머신, 수수료 계산, 비식별화 정규식). Vitest.
- **Integration**: API + DB (RLS 정책 포함). pgTAP 또는 Drizzle 시드 + supertest.
- **E2E**: Playwright. 플로우 A·B·C·D·E·F.
- **보안**: ZAP 자동 스캔, 의존성 SCA, 시크릿 누출 검사.
- **접근성**: axe-core E2E.

### 18.2 Given-When-Then 테스트 케이스 샘플

**T-AUTH-LOGIN-LOCK**

- Given: 사용자가 동일 계정 4회 비밀번호 오류
- When: 5번째 잘못된 비밀번호로 로그인 시도
- Then: 30분 잠금, `security_event` 생성, 사용자 이메일 알림 발송

**T-RLS-CASEFILE-CROSS-USER**

- Given: 슈퍼바이저 A에게 배정되지 않은 의뢰의 파일 ID
- When: 슈퍼바이저 A가 다운로드 URL 요청
- Then: 403 `forbidden`, `audit_logs`에 위반 시도 기록

**T-DEID-GATE**

- Given: 비식별화 체크 12항목 중 1개 미체크
- When: 파일 업로드 진행
- Then: 클라이언트에서 업로드 버튼 비활성, 서버에서도 422 차단

**T-PHI-SCAN**

- Given: 본문에 "010-1234-5678" 포함 PDF
- When: 업로드 완료 후 백그라운드 스캔
- Then: `phi_scan_status='suspicious'`, 슈퍼바이저 접근 차단, 운영팀 알림

**T-PAY-REFUND**

- Given: 결제 완료된 의뢰가 슈퍼바이저 거절됨
- When: 거절 처리
- Then: 토스 환불 API 호출, 환불 상태 `completed`, 사용자 알림, `audit_logs` 기록

**T-RETENTION-CRON**

- Given: 보관기간 30일이며 31일 경과한 케이스
- When: 자동삭제 cron 실행
- Then: S3 객체 삭제 + DB soft delete, `access_logs`에 `delete` 기록, 슈퍼바이지 알림

**T-2FA-REQUIRED**

- Given: 슈퍼바이저 가입 직후
- When: 2FA 미설정 상태에서 프로필 공개 시도
- Then: 422 `2fa_required`, 가이드 모달

**T-ADMIN-PHI-REASON**

- Given: 관리자 PHI 접근 모달
- When: 사유 30자 미만 입력 후 접근
- Then: 422, 접근 거절, 시도 자체는 `audit_logs` 기록

**T-COMPLETION-RECORD-SIGNATURE**

- Given: 슈퍼바이저가 완료 기록서에 디지털 도장 이미지 첨부 시도
- When: 업로드 요청
- Then: 422 (UI 자체에 입력란 없음 + 백엔드 거절)

**T-CHEAT-PHOTO-IN-NAME**

- Given: 케이스 제목에 "홍길동 평가" 입력
- When: 저장 시도
- Then: 422 `phi_detected`, 안내

### 18.3 보안 점검 체크리스트 (출시 게이트)

- TLS 등급 A 이상 (SSLLabs)
- 모든 PHI 컬럼 암호화 확인 (sample SELECT로 raw 노출 여부)
- RLS bypass 시나리오 통과
- presigned URL 만료·IP 바인딩
- 워터마크 확인 (열람자·시각)
- 백업 복원 리허설
- 권한 매트릭스 표 검증
- 개인정보 처리방침/약관 동의 흐름 확인
- 광고/추적 픽셀 미포함 확인 (네트워크 패널)
- robots/noindex 확인

---

## 19. 리스크 레지스터

| ID   | 리스크                                                                   | 영향    | 가능성 | 완화책                                                                                                               |
| ---- | ------------------------------------------------------------------------ | ------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| R-01 | PHI 포함 자료 업로드·유출                                                | 매우 큼 | 중     | 비식별화 게이트·정규식·워터마크·접근로그·운영팀 PHI 신고 SOP                                                         |
| R-02 | 완료 기록서가 외부 기관(법원·병무청 등) 효력으로 오해되어 자격·면허 분쟁 | 큼      | 중     | 책임범위 고정 문구(§15.2.13) PDF 마지막 페이지 강제, UX 카피 가이드(부록 D), 단독 "서명 상품" 금지, [⚖️ 백로그 자문] |
| R-03 | 자격 위조 슈퍼바이저 잠입                                                | 큼      | 중     | 운영팀 수동 검증, 자격기관 공식 조회, 발급기관 직접 확인                                                             |
| R-04 | 분쟁 시 자료 보존·노출 균형                                              | 큼      | 중     | 분쟁 상태에서 자료 격리, 관리자 PHI 접근 사유 강제                                                                   |
| R-05 | 결제 사기·환불 악용                                                      | 중      | 중     | 토스 사기 탐지, 환불 운영 SOP, 보류금 차감                                                                           |
| R-06 | Zoom 링크 노출로 외부인 침입                                             | 중      | 중     | 회의 1시간 전부터 노출, 슈퍼바이저에 비밀번호·대기실 강제 가이드                                                     |
| R-07 | 보관기간 만료 후 누락                                                    | 큼      | 낮음   | 자동삭제 cron 모니터링, 슈퍼바이지에 사전 알림                                                                       |
| R-08 | 비식별화 회피(파일 내 이름)                                              | 큼      | 중     | PHI 1차 스캔 + 슈퍼바이저 PHI 신고 권한                                                                              |
| R-09 | 슈퍼바이저 모객 실패                                                     | 큼      | 중     | 운영팀 직접 컨택, 학회·수련감독자 네트워크, 초기 수수료 인하 가능                                                    |
| R-10 | 슈퍼바이지 의뢰 부족                                                     | 큼      | 중     | 임상 커뮤니티 마케팅, 무료 첫 코멘트 캠페인 (1회 한정)                                                               |
| R-11 | 의료법/정신건강복지법 위반 가능성                                        | 매우 큼 | 낮음   | [⚖️ 변호사 검토] 출시 게이트, 환자 직접이용 차단, "진료" 용어 금지                                                   |
| R-12 | 개인정보보호법 위반 (동의·보관·접근)                                     | 매우 큼 | 낮음   | DPO 자문·정책 점검·로그 강제                                                                                         |
| R-13 | 시스템 장애로 의뢰 마감 위반                                             | 중      | 낮음   | SLA 정책, 자동 마감 연장 룰                                                                                          |
| R-14 | 외부 위탁(스토리지·PG) 사고                                              | 큼      | 낮음   | 위탁사 계약 점검, 위탁 고지, 백업                                                                                    |
| R-15 | 운영자 내부자 위협                                                       | 큼      | 낮음   | 최소권한·사유강제·감사로그·정기 점검                                                                                 |

---

## 20. 개발팀(Codex) 백로그 — 즉시 착수 가능

> 상태: `[ ] Todo`, `[~] In progress`, `[x] Done`. 각 작업은 8h 미만 단위로 분해.

### EPIC 0 — Bootstrap

- [ ] T-000 Monorepo 부트 (pnpm workspaces, apps/web, apps/admin, packages/db, packages/shared)
- [ ] T-001 ESLint·Prettier·tsconfig strict 일괄
- [ ] T-002 GitHub Actions CI (typecheck, lint, vitest, drizzle check)
- [ ] T-003 Supabase Seoul 프로젝트·KMS·Storage 버킷(`case-files`, `qualifications`, `completion-records`) 생성
- [ ] T-004 Drizzle 0000 스키마 마이그레이션 (§10.3)
- [ ] T-005 RLS 0001 마이그레이션 (`current_user_id()` GUC + 모든 테이블 정책)
- [ ] T-006 pgcrypto 헬퍼 (`packages/shared/src/crypto/phi.ts`)
- [ ] T-007 `withUserContext` 미들웨어 (트랜잭션별 GUC 설정)
- [ ] T-008 `.env.example`, README 셋업 가이드

### EPIC 1 — Auth

- [ ] T-100 Argon2id 비밀번호 해시·검증
- [ ] T-101 Better-Auth 통합 또는 자체 세션 구현
- [ ] T-102 이메일 인증 토큰
- [ ] T-103 TOTP 2FA 등록·검증 (관리자 필수, 슈퍼바이저 권장, 슈퍼바이지 선택)
- [ ] T-104 로그인 잠금·세션 무효화
- [ ] T-105 회원가입(역할·약관·민감정보 분리 동의, 이메일 또는 아이디 선택 가능)
- [ ] T-106 비밀번호 재설정
- [ ] T-107 카카오 소셜 로그인
- [ ] T-108 네이버 소셜 로그인

### EPIC 2 — Profile & Verification

- [ ] T-200 슈퍼바이저 프로필 CRUD
- [ ] T-201 자격 등록 + 자격증 파일 (별도 버킷, 운영자만 접근)
- [ ] T-202 전문분야 시드(`specialty_catalog`)
- [ ] T-203 슈퍼바이지 프로필 (간소)
- [ ] T-204 검색 API + 필터
- [ ] T-205 검색 페이지 UI
- [ ] T-206 슈퍼바이저 상세 페이지

### EPIC 3 — Service Products & Availability

- [ ] T-300 서비스 상품 CRUD
- [ ] T-301 가능시간 슬롯 CRUD
- [ ] T-302 슬롯 조회 API (예약 가능 시간 계산)

### EPIC 4 — Supervision Request

- [ ] T-400 상태 머신 구현 (§8 status enum + 전이 가드)
- [ ] T-401 케이스 패킷 폼 + 클라이언트 PHI 검증
- [ ] T-402 비식별화 체크리스트 게이트
- [ ] T-403 의뢰 Draft→Submit 흐름
- [ ] T-404 상태별 권한 가드 (서버·클라이언트 양쪽)

### EPIC 5 — Files

- [ ] T-500 Presigned URL 발급 API (S3 또는 Supabase Storage)
- [ ] T-501 클라이언트 업로드 (청크·진행률)
- [ ] T-502 업로드 등록 API (메타 + 잡 큐잉)
- [ ] T-503 ClamAV 스캔 워커
- [ ] T-504 PHI 정규식 스캔 워커
- [ ] T-505 다운로드 signed URL + 워터마크 PDF 변환 (PDF.js 또는 ghostscript)
- [ ] T-506 즉시 삭제 + 보관기간 만료 cron

### EPIC 6 — Payments

- [ ] T-600 토스페이먼츠 결제 키 발급·confirm 웹훅
- [ ] T-601 영수증·거래내역
- [ ] T-602 환불 API
- [ ] T-603 정산 산출 잡 (월 2회)

### EPIC 7 — Bookings

- [ ] T-700 슬롯 예약 API
- [ ] T-701 Zoom 링크 수동 입력·암호화
- [ ] T-702 회의 1시간 전 노출 가드
- [ ] T-703 리마인더 cron

### EPIC 8 — Supervision Workflow

- [ ] T-800 수락/거절/추가자료 API
- [ ] T-801 인라인 코멘트 모델·API
- [ ] T-802 종합 피드백
- [ ] T-803 직접 수정 파일 업로드 흐름
- [ ] T-804 PHI 신고 흐름

### EPIC 9 — Completion & Review

- [ ] T-900 완료 기록서 생성 + PDF (Puppeteer)
- [ ] T-901 책임범위 고정 문구 검증 테스트
- [ ] T-902 9항목 리뷰 + 신고

### EPIC 10 — Admin

- [ ] T-1000 관리자 IP allowlist·2FA
- [ ] T-1001 자격 검증 큐
- [ ] T-1002 PHI 접근 사유 모달
- [ ] T-1003 환불/분쟁/삭제 큐
- [ ] T-1004 통계 대시보드
- [ ] T-1005 카테고리·약관 관리

### EPIC 11 — Notifications & Logs

- [ ] T-1100 인앱 알림 모델·API
- [ ] T-1101 이메일 발송 (Resend) 템플릿 (PHI 미포함 검증 테스트)
- [ ] T-1102 알림 환경설정
- [ ] T-1103 `audit_logs` WORM 트리거
- [ ] T-1104 `access_logs` 자동 기록 미들웨어
- [ ] T-1105 보안 이벤트 Slack/이메일 채널

### EPIC 12 — Compliance & Docs

- [ ] T-1200 약관 v1·개인정보처리방침 v1·민감정보 동의 v1 초안 (변호사 자문은 출시 후 백로그)
- [ ] T-1201 책임범위 고지 카피 가이드 + 완료 기록서 PDF 마지막 페이지 고정 문구
- [ ] T-1202 임상자료 페이지 noindex / 비임상 페이지 SEO + 광고 픽셀 분리 설정
- [ ] T-1203 슈퍼바이저 서명·도장 이미지 등록 UI(`supervisor_profiles.signature_storage_key`) + 완료 기록서 자동 첨부
- [ ] T-1204 SOC 점검 체크리스트

### EPIC 13 — QA & Launch

- [ ] T-1300 E2E (Playwright) 플로우 A~F
- [ ] T-1301 보안 자동 스캔
- [ ] T-1302 펜테스트 1차
- [ ] T-1303 파일럿 초청코드 시스템
- [ ] T-1304 운영 매뉴얼 v1

---

## 부록 A. 기술 스택 비교

### A.1 빠른 MVP 스택 — Next.js + Supabase (권장)

- **Front**: Next.js 15 App Router + React 19 + TypeScript + Tailwind + shadcn/ui
- **API**: Next.js Route Handlers + Server Actions + Zod
- **DB**: PostgreSQL on Supabase Seoul + Drizzle ORM (psy-report-assistant 노하우 재사용)
- **Auth**: Better-Auth + TOTP + 카카오 OAuth
- **Storage**: Supabase Storage(서버측 암호화) → 출시 후 AWS S3 Seoul + KMS로 마이그
- **Payment**: 토스페이먼츠
- **Email**: Resend
- **Workers**: Supabase Edge Functions + Trigger.dev(클램AV·PHI 스캔·cron)
- **Hosting**: Vercel Pro (auth-gated previews)
- **WAF**: Cloudflare (앞단)
- **모니터링**: Sentry(PII off) + Supabase logs
- **장점**: 가장 빠른 부트, 한국 region, 운영 학습곡선 낮음, 기존 노하우
- **단점**: Supabase Storage 객체 단위 KMS는 제한 → 정식 단계에 AWS S3 이관 필요 가능성

### A.2 안정적 운영 스택 — Next.js + AWS Seoul

- 위와 동일하되 DB: AWS Aurora Postgres Seoul, Storage: S3 Seoul + KMS, Cron: EventBridge, Queue: SQS.
- **장점**: 엔터프라이즈 수준 컴플라이언스, KMS 키 정책 세분화
- **단점**: 인프라 운영 부담, 출시 지연 2~3주

### A.3 장기 확장 스택 — Microservices + Korean Cloud

- API Gateway + 서비스 분리(인증, 파일, 결제), 메시지 큐, KT/NHN/Naver Cloud Seoul 검토 (공공·의료 데이터센터 인증).
- **장점**: 공공 사업·기관 영업·자료 위탁 인증 요구 대응
- **단점**: MVP 단계 과잉, 인력 필요

### A.4 결론

**MVP·파일럿: A.1 권장.** 정식 출시 전(파일럿 종료 시) Storage·KMS만 A.2로 이관. 장기적으로 A.3 인증(공공·의료) 필요 시점에 마이그.

---

## 부록 B. 법률 검토 백로그 (출시 게이트 아님 — 구현은 우선 진행, 변호사·세무사·DPO 자문은 백로그 트랙으로 병행)

> 출시 전 변호사 게이트로 막지 않는다. 단, 각 항목은 분쟁·과징금 리스크가 실재하므로 운영 8주차 또는 첫 30일 이내 자문을 시작한다.

1. ⚖️ **의료법·정신건강복지법**: 슈퍼비전이 "진료"로 해석될 여지, 의료 광고 규제 표현 검토.
2. ⚖️ **완료 기록서 서명 효력 범위**: 외부 기관(법원·병무청·산재공단) 제출 시 효력 한계 및 카피 가이드.
3. ⚖️ **개인정보보호법**: 민감정보 수집·이용·제공 동의 항목, 보관기간, 위탁(스토리지·PG·메일) 고지, 국외이전 여부.
4. ⚖️ **신용정보·전자상거래법**: 결제 거래·정산 기록 보관기간(거래 5년 등).
5. ⚖️ **세무**: 사업소득세 원천징수, 세금계산서, 부가세 면세/과세 구분.
6. ⚖️ **자격기본법**: 임상심리전문가·정신건강임상심리사 자격명 표시·검증 표시의 범위.
7. ⚖️ **이용약관·환불정책**: 전자상거래법·약관규제법 적합성.
8. ⚖️ **위탁사 계약**: 토스페이먼츠·Supabase·AWS와의 데이터처리계약(DPA) 또는 위탁 고지문.
9. ⚖️ **PHI·민감자료 사고 대응**: 72시간 통지 의무(KISA·이용자) 절차.
10. ⚖️ **분쟁/소송 시 자료 보존 의무** 기간 및 절차.
11. ⚖️ **광고·마케팅 표시**: "검증", "전문", "보증" 표현 광고법·표시광고법 검토.
12. ⚖️ **미성년자**: 슈퍼바이지가 만 19세 미만 임상 자료를 다룰 때의 가이드.

---

## 부록 C. 가정 목록 (확정 필요)

| ID   | 가정                                                                | 영향               | 확정 방법            |
| ---- | ------------------------------------------------------------------- | ------------------ | -------------------- |
| A-01 | 도메인 별도 (예: `clinicalsupervision.kr` 또는 `cs-platform.co.kr`) | 인증·이메일·robots | 사용자 선택          |
| A-02 | 결제 PG는 토스페이먼츠 (네이버페이/카카오페이 옵션)                 | 결제 통합          | 가맹 신청 결과       |
| A-03 | 파일럿 슈퍼바이저 10~20명, 슈퍼바이지 30~50명                       | 운영 부담          | 마케팅 결과          |
| A-04 | 플랫폼 수수료 20% (정산 80%)                                        | 슈퍼바이저 모객    | 시장 반응 후 조정    |
| A-05 | MVP 보관기간 옵션 7/30/90일                                         | UX                 | 운영 정책            |
| A-06 | TOTP 2FA만 (SMS 미사용)                                             | 보안·비용          | 보안 정책            |
| A-07 | 모바일 앱 미제공, 반응형 웹만                                       | 일정               | 시장 반응 후         |
| A-08 | 알림은 인앱+이메일만 (알림톡 v2)                                    | UX                 | 카카오 비즈채널 비용 |
| A-09 | 자격 검증은 5영업일 수동 SLA                                        | 운영 인력          | 운영팀 합의          |
| A-10 | 완료 기록서 PDF는 Puppeteer 서버측 렌더링                           | 인프라             | 기술 선택            |
| A-11 | Zoom 미연동 (수동 링크)                                             | UX                 | v2 계획              |
| A-12 | 한국어만 (외국인 슈퍼바이지 제외)                                   | i18n               | 시장 정의            |

---

## 부록 D. UX 카피 가이드 (외부 노출 텍스트)

| 금지                                 | 권장                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| "1tier / 2tier"                      | "슈퍼바이저 / 슈퍼바이지"                                                               |
| "비동기 보고서 코멘트" / "동기 회의" | "비대면 슈퍼비전(코멘트형)" / "비대면 슈퍼비전(직접수정형)" / "비대면 슈퍼비전(회의형)" |
| "전문가 검증서/보증서"               | "슈퍼비전 완료 기록서 (슈퍼바이저 서명·도장 포함)"                                      |
| "외부 기관 제출 보장"                | "검토 범위 내 슈퍼비전 제공 사실 확인"                                                  |
| "전문가의 진료"                      | "전문가의 슈퍼비전"                                                                     |
| "AI 자동 해석"                       | (MVP 미포함)                                                                            |
| "치료 보장" / "효과 보장"            | "슈퍼비전 제공 사실 기록"                                                               |
| "내담자가 가입"                      | (B2C-환자 모델 아님)                                                                    |

---

## 부록 E. 운영 KPI 정의

| 지표                          | 정의                          | 목표 (파일럿 8주) |
| ----------------------------- | ----------------------------- | ----------------- |
| 유료 슈퍼비전 성사 건수       | `payments.status='paid'` 누계 | 50건              |
| 슈퍼바이지 재이용률           | 2건 이상 결제 사용자 비율     | 30%               |
| 슈퍼바이저 평균 응답시간      | 의뢰 제출→수락 시각 P50       | 12h               |
| 매칭 성공률                   | 수락된 의뢰/전체 의뢰         | 80%               |
| 결제 전환율                   | 의뢰 제출→결제 완료           | 70%               |
| 환불률                        | 환불 건수/결제 건수           | < 8%              |
| 추가자료 요청률               | 추가자료 발생 의뢰 비율       | < 30%             |
| 평균 만족도                   | 9항목 평균                    | ≥ 4.3/5           |
| 보안 사고                     | PHI 노출·접근 위반            | 0                 |
| 보관기간 만료 자동삭제 성공률 | cron 성공률                   | 100%              |
| 개인정보 삭제 SLA             | 요청→완료 24시간 이내 비율    | 100%              |

---

## 부록 F. Codex 작업 진입 순서 (제안)

1. **Day 1~2**: EPIC 0 전부 + EPIC 1 T-100~T-103
2. **Day 3~4**: EPIC 1 마무리 + EPIC 2 T-200~T-203
3. **Week 2 후반**: EPIC 2 마무리 + 검색 페이지
4. **Week 3**: EPIC 3 + EPIC 4 시작
5. **Week 4**: EPIC 5 전부 (파일 보안이 가장 중요)
6. **Week 5**: EPIC 6 + EPIC 7
7. **Week 6**: EPIC 8 + EPIC 9
8. **Week 7**: EPIC 10 + EPIC 11
9. **Week 8**: EPIC 12 + EPIC 13 (게이트)

매 EPIC 종료 시 보안 점검 체크리스트 §18.3 부분 통과 확인.

---

## 마지막 체크 (이 문서를 Codex에 붙여넣기 전)

- [ ] 토스페이먼츠 가맹 신청
- [ ] Supabase Seoul 결제 카드 등록
- [ ] 도메인·이메일(Resend SPF/DKIM) 준비
- [ ] 광고 픽셀(Meta, Google Ads, Naver, GTM) 비임상 페이지 한정 적용 명세
- [ ] 운영팀 SLA 합의 (자격검증 5영업일, 분쟁 24시간)
- [ ] 파일럿 슈퍼바이저 컨택 리스트 30명
- [ ] 약관·정책 초안 작성 시작 (변호사 자문은 출시 후 백로그)
- [ ] DPO/개인정보보호 책임자 지정 (출시 후 60일 이내)

**이 시점부터 Codex에게 본 문서 그대로 전달 → EPIC 0부터 착수 가능.**
