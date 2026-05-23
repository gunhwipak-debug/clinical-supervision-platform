import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { tokens } from "../packages/design-tokens/src/tokens";

type ScreenRow = {
  area: string;
  route: string;
  desktop: string;
  mobile: string;
};

type ScreenArtifact = ScreenRow & {
  desktopExists: boolean;
  mobileExists: boolean;
  desktopBytes: number | null;
  mobileBytes: number | null;
};

const screensPath = "demo-evidence/SCREENS.md";
const outputJsonPath = "demo-evidence/DESIGN-HANDOFF.json";
const outputMdPath = "demo-evidence/DESIGN-HANDOFF.md";

const priorities = [
  {
    phase: "1",
    title: "Auth + Trust Entry",
    routes: ["/", "/login", "/signup", "/forgot-password", "/reset-password"],
    intent: "첫 진입에서 신뢰감, 보안 범위, 다음 행동을 명확히 한다."
  },
  {
    phase: "2",
    title: "Catalog + Request Start",
    routes: ["/supervisors", "/supervisors/:id", "/requests/new"],
    intent: "슈퍼바이저 탐색에서 의뢰 생성까지의 선택 피로를 줄인다."
  },
  {
    phase: "3",
    title: "Flow A Work Surfaces",
    routes: ["/requests/:id", "/supervisor/requests/:id", "/payments/:id"],
    intent:
      "민감 자료 검토, 결제, 피드백, 완료기록 발급의 상태 전이를 선명하게 보여준다."
  },
  {
    phase: "4",
    title: "Ops Consoles",
    routes: ["/supervisor", "/admin", "/admin/qualifications", "/admin/refunds"],
    intent: "운영자가 큐와 리스크를 빠르게 스캔할 수 있게 한다."
  }
] as const;

function main() {
  const screens = parseScreens(readFileSync(screensPath, "utf8"));
  const artifacts = screens.map(toArtifact);
  mkdirSync(dirname(outputJsonPath), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: {
      tokens: "packages/design-tokens/src/tokens.ts",
      screenshots: screensPath,
      figmaGuide: "docs/decisions/DESIGN-FIGMA.md"
    },
    tokens,
    priorities,
    screens: artifacts
  };

  writeFileSync(outputJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(outputMdPath, renderMarkdown(artifacts));

  const missing = artifacts.filter((item) => !item.desktopExists || !item.mobileExists);
  console.log(
    `Design handoff written: ${outputJsonPath}, ${outputMdPath} (${String(artifacts.length)} screens)`
  );
  if (missing.length > 0) {
    console.warn(
      `Missing screenshots: ${missing.map((item) => item.route).join(", ")}`
    );
  }
}

function parseScreens(markdown: string): ScreenRow[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line.startsWith("|") && line.includes("demo-evidence/screenshots/")
    )
    .map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim().replace(/^`|`$/g, ""))
        .filter(Boolean)
    )
    .map(([area, route, desktop, mobile]) => ({ area, route, desktop, mobile }))
    .filter((row): row is ScreenRow =>
      Boolean(row.area && row.route && row.desktop && row.mobile)
    );
}

function toArtifact(row: ScreenRow): ScreenArtifact {
  const desktop = fileInfo(row.desktop);
  const mobile = fileInfo(row.mobile);
  return {
    ...row,
    desktopExists: desktop.exists,
    mobileExists: mobile.exists,
    desktopBytes: desktop.bytes,
    mobileBytes: mobile.bytes
  };
}

function fileInfo(path: string): { exists: boolean; bytes: number | null } {
  const absolute = resolve(path);
  if (!existsSync(absolute)) return { exists: false, bytes: null };
  return { exists: true, bytes: statSync(absolute).size };
}

function renderMarkdown(screens: ScreenArtifact[]): string {
  const generatedAt = new Date().toISOString();
  const missing = screens.filter((item) => !item.desktopExists || !item.mobileExists);
  const screenRows = screens
    .map(
      (screen) =>
        `| ${screen.area} | \`${screen.route}\` | \`${basename(screen.desktop)}\` | \`${basename(screen.mobile)}\` | ${screen.desktopExists && screen.mobileExists ? "OK" : "MISSING"} |`
    )
    .join("\n");
  const priorityBlocks = priorities
    .map(
      (priority) =>
        `### ${priority.phase}. ${priority.title}\n\n- Intent: ${priority.intent}\n- Routes: ${priority.routes.map((route) => `\`${route}\``).join(", ")}`
    )
    .join("\n\n");

  return `# Design Handoff

Generated at: ${generatedAt}

This packet is the bridge from the local demo UI to Stitch/Figma redesign work. It keeps code tokens, screenshot evidence, and route priorities in one place so a designer or another agent can start without re-scanning the repo.

## Source Of Truth

- Tokens: \`packages/design-tokens/src/tokens.ts\`
- Tailwind theme export: \`packages/design-tokens/src/tokens.css\`
- Screenshot catalog: \`demo-evidence/SCREENS.md\`
- Figma setup: \`docs/decisions/DESIGN-FIGMA.md\`
- Machine-readable handoff: \`demo-evidence/DESIGN-HANDOFF.json\`

## Redesign Priorities

${priorityBlocks}

## Token Summary

- Brand: ${tokens.color.brand[500]} / ${tokens.color.brand[600]} / ${tokens.color.brand[700]}
- Accent: ${tokens.color.accent[100]} / ${tokens.color.accent[500]} / ${tokens.color.accent[600]}
- Surfaces: ${tokens.color.surface.base}, ${tokens.color.surface.elevated}, ${tokens.color.surface.sunken}
- Radius: sm ${String(tokens.radius.sm)}px, md ${String(tokens.radius.md)}px, lg ${String(tokens.radius.lg)}px, xl ${String(tokens.radius.xl)}px
- Font: ${tokens.font.family.sans}

## Screen Evidence

| Area | Route | Desktop | Mobile | Status |
| ---- | ----- | ------- | ------ | ------ |
${screenRows}

## Notes For Stitch/Figma

- Keep the security boundaries visible: PHI access is purpose-limited, admin reasons are audited, and public search never exposes encrypted clinical content.
- Prefer real workflow surfaces over marketing-only layouts. The first viewport should still expose the next action.
- Preserve token names when translating to Figma variables: \`brand-600\`, \`surface-base\`, \`ink-700\`, \`line\`, \`radius-lg\`.
- If using an HTML-to-design capture tool, remove any temporary capture script after use; do not leave remote capture scripts in the app source.

${missing.length === 0 ? "All referenced screenshots exist." : `Missing screenshots: ${missing.map((item) => item.route).join(", ")}`}
`;
}

main();
