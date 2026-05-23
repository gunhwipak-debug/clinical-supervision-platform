# DESIGN-FIGMA

## Figma 변수 연결

현재 활성 디자인 파일:

- `Clinical Supervision Platform UI`
- file key: `wdlrPsEaRnZ92KuUCkahCC`
- URL: `https://www.figma.com/design/wdlrPsEaRnZ92KuUCkahCC/Clinical-Supervision-Platform-UI`

1. Figma Settings -> Account -> Personal access tokens에서 토큰을 발급한다.
2. 빈 Figma Design 파일을 만들고 URL의 `figma.com/design/<fileKey>/...`에서 file key를 복사한다.
3. `.env.local`에 `FIGMA_ACCESS_TOKEN`, `FIGMA_FILE_KEY`를 넣는다. 이 파일은 커밋하지 않는다.
4. `pnpm figma:push`를 실행하면 Figma Variables REST API로 `CSP/color`, `CSP/spacing`, `CSP/radius`, `CSP/font/size`, `CSP/font/weight`, `CSP/font/family`, `CSP/shadow` 컬렉션을 생성하거나 갱신한다.
5. 디자인 작업에서는 Local Variables의 `CSP/color`, `CSP/spacing`, `CSP/radius`, `CSP/font`, `CSP/shadow` 이름 체계를 사용한다.
6. Figma에서 색이나 간격을 바꾸는 운영은 `pnpm figma:pull`로 코드 diff를 확인한 뒤 토큰 파일을 리뷰한다.
7. `.mcp.json`에는 Figma Dev Mode MCP entry를 추가했다. Codex/Claude 실행 환경에 따라 직접 연결 여부가 달라질 수 있다.

## 현재 한계

Figma REST Variables API는 계정 권한과 파일 권한에 민감하다. 토큰이나 file key가 없으면 스크립트는 실패가 아니라 skip으로 종료한다. 토큰을 넣었는데 실패하면 파일 편집 권한, Enterprise/Tier endpoint 접근, `file_variables:read/write` scope를 먼저 확인한다.

## Stitch/Figma 재구성 핸드오프

현재 코드 토큰은 `/Users/gunhwiair/Desktop/stitch_clinical_trust_auth_redesign.zip`의 `clinical_trust_system/DESIGN.md`와 `_2` 계열 화면을 기준으로 blue/navy 방향으로 전환했다. 이후 Figma/Stitch 작업도 green/salmon 초기안보다 clinical blue, light blue-gray surface, navy text를 기본 방향으로 삼는다.

`pnpm design:handoff`는 현재 코드 토큰, `demo-evidence/SCREENS.md`의 화면 목록, 데스크톱/모바일 스크린샷 존재 여부를 묶어 `demo-evidence/DESIGN-HANDOFF.md`와 `demo-evidence/DESIGN-HANDOFF.json`을 만든다. Stitch나 Figma에서 화면을 다시 잡기 전에는 이 파일을 먼저 확인한다.

`pnpm design:stitch-prompts`는 위 핸드오프를 먼저 갱신한 뒤 `demo-evidence/STITCH-PROMPTS.md`와 `demo-evidence/STITCH-PROMPTS.json`을 생성한다. 이 파일에는 전체 디자인 방향, 4개 phase prompt, 25개 화면별 prompt가 들어간다. Google Stitch 같은 화면 생성 도구에는 phase prompt를 먼저 넣고, 결과가 흔들리면 screen-level prompt로 좁혀 재시도한다.

핸드오프의 우선순위는 다음 순서로 본다.

1. Auth + Trust Entry: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
2. Catalog + Request Start: `/supervisors`, `/supervisors/:id`, `/requests/new`
3. Flow A Work Surfaces: `/requests/:id`, `/supervisor/requests/:id`, `/payments/:id`
4. Ops Consoles: `/supervisor`, `/admin`, `/admin/qualifications`, `/admin/refunds`

HTML-to-design 캡처 도구를 쓸 때 임시 capture script를 앱 소스에 남기지 않는다. 로컬 화면 캡처가 필요하면 브라우저 세션이나 일회성 캡처 절차로 처리하고, 제품 코드에는 원격 capture script를 커밋하지 않는다.

## MCP 권한 메모

Figma MCP로 새 파일을 만들거나 기존 파일에 쓰려면 해당 Figma team/file에 편집 권한이 필요하다. 계정이 view seat이면 토큰 동기화 문서와 로컬 핸드오프 패킷까지는 준비할 수 있지만, Figma 파일 생성/수정은 사용자가 편집 권한을 가진 파일키를 제공한 뒤 진행한다.
