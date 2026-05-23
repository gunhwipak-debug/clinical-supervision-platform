import { readFileSync, writeFileSync } from "node:fs";

type Screen = {
  area: string;
  route: string;
  desktop: string;
  mobile: string;
  desktopExists: boolean;
  mobileExists: boolean;
};

type Priority = {
  phase: string;
  title: string;
  routes: string[];
  intent: string;
};

type Handoff = {
  generatedAt: string;
  sourceOfTruth: Record<string, string>;
  tokens: {
    color: {
      brand: Record<string, string>;
      accent: Record<string, string>;
      surface: Record<string, string>;
      ink: Record<string, string>;
      line: string;
    };
    radius: Record<string, number>;
    font: { family: { sans: string } };
  };
  priorities: Priority[];
  screens: Screen[];
};

const handoffPath = "demo-evidence/DESIGN-HANDOFF.json";
const outputJsonPath = "demo-evidence/STITCH-PROMPTS.json";
const outputMdPath = "demo-evidence/STITCH-PROMPTS.md";

const routeBriefs: Record<string, string> = {
  "/": "서비스 신뢰, 보안 경계, Flow A 시작 CTA를 첫 화면에서 빠르게 이해시키는 public entry.",
  "/login": "데모 계정과 실제 계정 모두 자연스럽게 진입하는 간결한 보안 로그인 화면.",
  "/signup": "동의 항목과 이메일 인증 흐름을 부담스럽지 않게 설명하는 회원가입 화면.",
  "/verify-email": "메일 인증이 필요한 상태를 조용하고 명확하게 안내하는 대기 화면.",
  "/forgot-password": "계정 복구 요청을 짧은 폼과 보안 안내로 처리하는 화면.",
  "/reset-password": "토큰 기반 비밀번호 재설정과 기존 세션 무효화를 이해시키는 화면.",
  "/supervisors": "검증된 슈퍼바이저를 비교하고 필터링하는 catalog 화면.",
  "/supervisors/:id":
    "프로필, 자격, 상품, 가능시간을 기반으로 의뢰 시작 결정을 돕는 상세 화면.",
  "/requests": "슈퍼바이지가 자신의 의뢰 상태를 빠르게 스캔하는 목록 화면.",
  "/requests/new":
    "보관기간, 케이스 패킷, 비식별화, 제출 확인을 단계별로 진행하는 wizard.",
  "/requests/:id":
    "의뢰 상태, 케이스 자료, 결제, 피드백, 완료기록을 상태별로 보여주는 work surface.",
  "/payments": "결제 내역을 영수증 보관함처럼 스캔하는 목록 화면.",
  "/payments/:id":
    "금액 breakdown, 결제 상태, 환불 요청을 분명하게 분리한 영수증 상세.",
  "/settings": "계정 보안, 세션, 비밀번호, TOTP 상태를 확인하는 설정 화면.",
  "/supervisor": "슈퍼바이저가 새 의뢰, 검토 중, 완료 상태를 보는 업무 dashboard.",
  "/supervisor/requests":
    "슈퍼바이저 의뢰 큐를 상태와 다음 행동 중심으로 스캔하는 목록.",
  "/supervisor/requests/:id":
    "민감 자료 검토, 수락/반려, 피드백, 완료기록 발급까지 이어지는 전문가 작업 화면.",
  "/supervisor/profile":
    "공개 프로필과 검증 상태를 정리하는 supervisor profile 관리 화면.",
  "/supervisor/qualifications":
    "자격 추가와 승인 대기 상태를 명확히 보여주는 자격 관리 화면.",
  "/supervisor/products": "서비스 상품 가격과 활성 상태를 관리하는 상품 화면.",
  "/supervisor/availability":
    "가능 시간 슬롯을 요일/시간 중심으로 정리하는 availability 화면.",
  "/admin": "운영자가 승인, 환불, 감사 리스크를 카운트 카드로 파악하는 dashboard.",
  "/admin/qualifications": "자격 승인 큐와 30자 이상 reason 입력을 강조하는 운영 화면.",
  "/admin/refunds": "환불 요청 큐를 처리 전 검토 상태로 보여주는 stub 화면.",
  "/admin/payouts": "정산 기간과 예정 금액을 확인하는 운영 정산 화면."
};

function main() {
  const handoff = JSON.parse(readFileSync(handoffPath, "utf8")) as Handoff;
  const prompts = buildPrompts(handoff);
  writeFileSync(outputJsonPath, `${JSON.stringify(prompts, null, 2)}\n`);
  writeFileSync(outputMdPath, renderMarkdown(prompts));
  console.log(`Stitch prompts written: ${outputJsonPath}, ${outputMdPath}`);
}

function buildPrompts(handoff: Handoff) {
  const screenByRoute = new Map(
    handoff.screens.map((screen) => [screen.route, screen])
  );
  const globalPrompt = globalDesignPrompt(handoff);
  const phases = handoff.priorities.map((priority) => {
    const screens = priority.routes
      .map((route) => screenByRoute.get(route))
      .filter((screen): screen is Screen => Boolean(screen));
    return {
      phase: priority.phase,
      title: priority.title,
      intent: priority.intent,
      routes: priority.routes,
      screenshots: screens.map((screen) => ({
        route: screen.route,
        desktop: screen.desktop,
        mobile: screen.mobile
      })),
      prompt: phasePrompt(handoff, priority, screens)
    };
  });
  const screenPrompts = handoff.screens.map((screen) => ({
    area: screen.area,
    route: screen.route,
    desktop: screen.desktop,
    mobile: screen.mobile,
    prompt: screenPrompt(handoff, screen)
  }));

  return {
    generatedAt: new Date().toISOString(),
    inputs: {
      handoff: handoffPath,
      screenshots: "demo-evidence/screenshots/"
    },
    globalPrompt,
    phases,
    screenPrompts
  };
}

function globalDesignPrompt(handoff: Handoff): string {
  const brand500 = tokenString(handoff.tokens.color.brand["500"], "color.brand.500");
  const brand600 = tokenString(handoff.tokens.color.brand["600"], "color.brand.600");
  const brand700 = tokenString(handoff.tokens.color.brand["700"], "color.brand.700");
  const accent100 = tokenString(handoff.tokens.color.accent["100"], "color.accent.100");
  const accent500 = tokenString(handoff.tokens.color.accent["500"], "color.accent.500");
  const surfaceBase = tokenString(
    handoff.tokens.color.surface["base"],
    "color.surface.base"
  );
  const surfaceElevated = tokenString(
    handoff.tokens.color.surface["elevated"],
    "color.surface.elevated"
  );
  const surfaceSunken = tokenString(
    handoff.tokens.color.surface["sunken"],
    "color.surface.sunken"
  );
  const ink900 = tokenString(handoff.tokens.color.ink["900"], "color.ink.900");
  const ink700 = tokenString(handoff.tokens.color.ink["700"], "color.ink.700");
  const ink500 = tokenString(handoff.tokens.color.ink["500"], "color.ink.500");
  return [
    "You are redesigning the Clinical Supervision Platform, a Korean clinical supervision web app for supervisees, supervisors, and admins.",
    "Use the provided screenshots as workflow evidence, not as a visual ceiling. Preserve the actual product flow and security boundaries.",
    "Design language: calm, trustworthy, clinical, work-focused, not marketing-heavy. Prefer dense but readable operational surfaces.",
    `Use these semantic tokens: brand ${brand500}/${brand600}/${brand700}, accent ${accent100}/${accent500}, surface ${surfaceBase}/${surfaceElevated}/${surfaceSunken}, ink ${ink900}/${ink700}/${ink500}, line ${handoff.tokens.color.line}.`,
    `Radius scale: sm ${String(handoff.tokens.radius["sm"])}px, md ${String(handoff.tokens.radius["md"])}px, lg ${String(handoff.tokens.radius["lg"])}px, xl ${String(handoff.tokens.radius["xl"])}px. Font: ${handoff.tokens.font.family.sans}.`,
    "Do not invent new product features. Do not weaken PHI, RLS, auth, admin reason, or audit boundaries. Copy should be Korean, concise, and operational.",
    "Return desktop and mobile responsive layouts. Use cards for repeated entities and task panels; avoid decorative card nesting and oversized marketing hero patterns."
  ].join("\n");
}

function tokenString(value: string | undefined, path: string): string {
  if (!value) throw new Error(`Missing design token: ${path}`);
  return value;
}

function phasePrompt(handoff: Handoff, priority: Priority, screens: Screen[]): string {
  const screenList = screens
    .map(
      (screen) =>
        `- ${screen.route}: desktop ${screen.desktop}, mobile ${screen.mobile}; ${routeBriefs[screen.route] ?? "Preserve the existing workflow and improve visual clarity."}`
    )
    .join("\n");
  return `${globalDesignPrompt(handoff)}

Focus phase ${priority.phase}: ${priority.title}
Intent: ${priority.intent}

Use these existing screen references:
${screenList || "- No exact screenshot mapped. Use the route list as target scope."}

Design requirements:
- Keep the first viewport actionable and show a hint of the next workflow step.
- Use Korean labels for statuses and raw enums.
- Ensure mobile 390px has no overlapping badges, buttons, or long clinical text.
- Include empty, loading, and error state guidance for list/detail surfaces in this phase.
- Show trust boundaries through subtle helper text, badges, and audit/security affordances, not alarmist copy.`;
}

function screenPrompt(handoff: Handoff, screen: Screen): string {
  return `${globalDesignPrompt(handoff)}

Redesign one screen: ${screen.route}
Area: ${screen.area}
Current evidence:
- Desktop screenshot: ${screen.desktop}
- Mobile screenshot: ${screen.mobile}

Screen job:
${routeBriefs[screen.route] ?? "Make the existing workflow clearer without changing the product scope."}

Output expectations:
- One desktop layout and one mobile layout.
- Keep current actions and data hierarchy.
- Use semantic clinical-supervision copy in Korean.
- Preserve security boundaries: no new PHI exposure, no new admin abilities, no fake external integrations.
- Prioritize legibility, status recognition, and next-action clarity.`;
}

function renderMarkdown(prompts: ReturnType<typeof buildPrompts>): string {
  const phaseBlocks = prompts.phases
    .map(
      (phase) => `## Phase ${phase.phase}. ${phase.title}

Intent: ${phase.intent}

Routes: ${phase.routes.map((route) => `\`${route}\``).join(", ")}

\`\`\`text
${phase.prompt}
\`\`\`
`
    )
    .join("\n");
  const screenBlocks = prompts.screenPrompts
    .map(
      (screen) => `### ${screen.area} ${screen.route}

- Desktop: \`${screen.desktop}\`
- Mobile: \`${screen.mobile}\`

\`\`\`text
${screen.prompt}
\`\`\`
`
    )
    .join("\n");

  return `# Stitch Prompt Pack

Generated at: ${prompts.generatedAt}

Use this file by copying one phase prompt or one screen prompt into Stitch/Figma-oriented generation tools. The prompts assume the screenshot files under \`demo-evidence/screenshots/\` are available as visual references.

## Global Prompt

\`\`\`text
${prompts.globalPrompt}
\`\`\`

${phaseBlocks}

## Screen-Level Prompts

${screenBlocks}
`;
}

main();
