# E2E-UI-FIGMA

## 결정 요약

- 디자인 토큰은 `packages/design-tokens/src/tokens.ts`를 단일 원천으로 둔다. Tailwind v4 `@theme`는 `tokens.css`에서 생성하고, 화면 코드는 `brand-600`, `surface-base`, `ink-700` 같은 의미 토큰만 사용한다.
- dev PHI DB는 PGlite `pgcrypto` contrib를 우선 채택했다. 로컬 메모리 검증에서 `pgp_sym_encrypt/decrypt` 라운드트립이 통과해 Docker 없이 case packet PHI 쓰기까지 이어갈 수 있다.
- PGlite에서 `json_agg(json_build_object(... order by ...))` 형태의 공개 프로필 집계가 WASM abort를 유발할 수 있어, 공개 검색/상세의 상품·전문분야·자격 목록은 단순 SELECT 후 TypeScript에서 조립한다.
- `phiAccess`는 TOTP와 case packet, supervisor feedback, completion record 암호화 컬럼에만 확장했다. 결제, 검색, 관리자 카운트, 공개 화면은 PHI GUC를 세팅하지 않는다.
- Flow A 상태 전이는 `packages/shared/src/supervision/status-machine.ts`에 계속 모은다. 결제 이후 `awaiting_supervisor_review -> accepted -> in_review -> feedback_submitted -> completion_record_issued -> completed`를 앱 레이어에서 강제한다.
- Figma 동기화는 코드 토큰을 먼저 Figma 변수 컬렉션으로 밀고, 이후 Figma 변경을 pull diff로 확인하는 양방향 운영이다. 토큰 미설정 환경에서는 graceful skip을 보장하고, 토큰이 있으면 Variables REST API로 upsert한다.

## 색과 타이포

브랜드 색은 Stitch의 후반부 `Clinical Trust System` 시안을 기준으로 차분한 clinical blue/navy 계열로 전환했다. 핵심 액션은 `brand-600`, 권위와 보안 경계는 `brand-700`, 보조 정보와 focus 계열은 밝은 blue/cyan accent로 처리한다. 표면은 `surface-base/elevated/sunken`, 본문은 `ink-*`를 사용해 어두운 금융앱처럼 보이지 않도록 밝은 업무용 SaaS 톤을 유지한다. 글꼴은 `@fontsource/pretendard` self-host로 외부 네트워크 의존을 제거한다.

## 한계와 회수 지점

파일 업로드, PDF 렌더, Zoom, 실제 환불 처리, webhook 운영 IP allowlist는 이번 흐름에서 제외했다. 관리자 PHI 접근 화면은 아직 노출하지 않았고, EPIC 10/11에서 사유 입력 UX와 감사 로그 화면을 함께 회수한다.
