#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const evidenceFlagIndex = args.indexOf("--evidence");
const evidencePath =
  evidenceFlagIndex >= 0 && args[evidenceFlagIndex + 1]
    ? args[evidenceFlagIndex + 1]
    : null;

const checks = [];
const warnings = [];

function projectPath(path) {
  return join(root, path);
}

function readText(path) {
  return readFileSync(projectPath(path), "utf8");
}

function addCheck(name, passed, details = "") {
  checks.push({
    name,
    status: passed ? "pass" : "fail",
    details
  });
}

function addWarning(name, details = "") {
  warnings.push({
    name,
    details
  });
}

function walkFiles(start, predicate = () => true) {
  const absoluteStart = projectPath(start);
  if (!existsSync(absoluteStart)) return [];

  const output = [];
  const stack = [absoluteStart];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const item of readdirSync(current)) {
        if (item === "node_modules" || item === ".next") continue;
        stack.push(join(current, item));
      }
      continue;
    }
    if (predicate(current)) {
      output.push(relative(root, current));
    }
  }
  return output.sort();
}

function assertOriginScreens() {
  const originDir = "demo-evidence/rebuild-tech-ui/all-pages-20260614-0400";
  const absoluteOriginDir = projectPath(originDir);
  if (!existsSync(absoluteOriginDir)) {
    addCheck("origin screenshot directory exists", false, originDir);
    return;
  }

  const pngs = readdirSync(absoluteOriginDir)
    .filter((file) => file.endsWith(".png"))
    .sort();
  const originPngs = pngs.filter((file) => file !== "00-all-pages-contact-sheet.png");
  const hasContactSheet = pngs.includes("00-all-pages-contact-sheet.png");

  addCheck(
    "origin screenshot set has 14 page PNGs",
    originPngs.length === 14,
    `${originPngs.length} page PNGs; contact sheet ${hasContactSheet ? "present" : "missing"}`
  );
}

function assertNoStaticPreviewRuntime() {
  const forbiddenFiles = [
    "apps/web/src/components/workflow-preview-pages.tsx",
    "apps/web/src/design-sources/clinicflow-tech-preview.html"
  ];

  for (const file of forbiddenFiles) {
    addCheck(`runtime preview file absent: ${file}`, !existsSync(projectPath(file)));
  }

  const globalsPath = "apps/web/src/app/globals.css";
  const globals = existsSync(projectPath(globalsPath)) ? readText(globalsPath) : "";
  addCheck(
    "Tailwind does not scan design-sources preview HTML",
    !globals.includes('@source "../design-sources"'),
    globalsPath
  );

  const runtimeFiles = walkFiles(
    "apps/web/src",
    (file) => /\.(ts|tsx|css)$/.test(file) && !file.includes("/design-sources/")
  );
  const forbiddenPatterns = [
    "workflow-preview-pages",
    "readPreviewSource",
    "readFileSync(sourcePath)"
  ];
  const matches = [];
  for (const file of runtimeFiles) {
    const text = readFileSync(projectPath(file), "utf8");
    for (const pattern of forbiddenPatterns) {
      if (text.includes(pattern)) {
        matches.push(`${file}: ${pattern}`);
      }
    }
  }
  addCheck(
    "runtime code does not reintroduce static preview reader",
    matches.length === 0,
    matches.join("; ")
  );
}

function assertRouteCoverage() {
  const pageFiles = [
    ...walkFiles("apps/web/src/app", (file) => file.endsWith("/page.tsx")),
    ...walkFiles("apps/admin/src/app", (file) => file.endsWith("/page.tsx"))
  ].sort();

  addCheck(
    "route page template count remains 44",
    pageFiles.length === 44,
    `${pageFiles.length}`
  );
}

function routeFromPageFile(file, appRoot) {
  const appRootDepth = appRoot.split("/").length;
  const routeParts = file
    .split("/")
    .slice(appRootDepth, -1)
    .filter((part) => !(part.startsWith("(") && part.endsWith(")")));

  return `/${routeParts.join("/")}`;
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function assertRouteManifestCoverage() {
  const manifestPath = "docs/ui-ux/clinicflow-route-alignment-manifest.md";
  if (!existsSync(projectPath(manifestPath))) {
    addCheck("route manifest exists for route coverage", false, manifestPath);
    return;
  }

  const routePaths = [
    ...walkFiles("apps/web/src/app", (file) => file.endsWith("/page.tsx")).map((file) =>
      routeFromPageFile(file, "apps/web/src/app")
    ),
    ...walkFiles("apps/admin/src/app", (file) => file.endsWith("/page.tsx")).map(
      (file) => routeFromPageFile(file, "apps/admin/src/app")
    )
  ];
  const manifestRoutes = readText(manifestPath)
    .split("\n")
    .map((line) => line.match(/^\| `([^`]+)`\s+\|/))
    .filter(Boolean)
    .map((match) => match[1]);

  const expectedCounts = countValues(routePaths);
  const manifestCounts = countValues(manifestRoutes);
  const missing = [];
  const extra = [];

  for (const [route, expectedCount] of expectedCounts.entries()) {
    const manifestCount = manifestCounts.get(route) ?? 0;
    if (manifestCount < expectedCount) {
      missing.push(`${route} x${expectedCount - manifestCount}`);
    }
  }

  for (const [route, manifestCount] of manifestCounts.entries()) {
    const expectedCount = expectedCounts.get(route) ?? 0;
    if (expectedCount < manifestCount) {
      extra.push(`${route} x${manifestCount - expectedCount}`);
    }
  }

  addCheck(
    "route manifest maps every page template exactly once",
    missing.length === 0 && extra.length === 0,
    [
      ...missing.map((item) => `missing ${item}`),
      ...extra.map((item) => `extra ${item}`)
    ].join("; ")
  );
}

function routeSurfaceText(pageFile) {
  const absolutePage = projectPath(pageFile);
  const routeDir = dirname(absolutePage);
  let text = readFileSync(absolutePage, "utf8");

  for (const item of readdirSync(routeDir)) {
    const siblingPath = join(routeDir, item);
    if (
      siblingPath !== absolutePage &&
      statSync(siblingPath).isFile() &&
      /\.(ts|tsx)$/.test(siblingPath)
    ) {
      text += `\n${readFileSync(siblingPath, "utf8")}`;
    }
  }

  return text;
}

function assertRouteArchetypeCoverage() {
  const pageFiles = [
    ...walkFiles("apps/web/src/app", (file) => file.endsWith("/page.tsx")),
    ...walkFiles("apps/admin/src/app", (file) => file.endsWith("/page.tsx"))
  ].sort();
  const markers = [
    "AppShell",
    "SiteHeader",
    "AdminShell",
    "AuthScaffold",
    "InfoPage",
    "LoginRequiredState",
    "RoleRequiredState",
    "EmptyState",
    "redirect(",
    "AdminHomePage",
    "FlowStepNav",
    "SummaryLine",
    "AdminDarkPanel"
  ];
  const weakRoutes = [];

  for (const pageFile of pageFiles) {
    const text = routeSurfaceText(pageFile);
    if (!markers.some((marker) => text.includes(marker))) {
      weakRoutes.push(pageFile);
    }
  }

  addCheck(
    "every route surface uses an origin-14 shell or archetype primitive",
    weakRoutes.length === 0,
    weakRoutes.join(", ")
  );
}

function assertDocs() {
  const requiredDocs = [
    "AGENTS.md",
    "docs/ui-ux/clinicflow-current-design-contract.md",
    "docs/ui-ux/clinicflow-origin14-design-system.md",
    "docs/ui-ux/clinicflow-ia-navigation-refactor-plan.md",
    "docs/ui-ux/clinicflow-release-hygiene-blockers.md",
    "docs/ui-ux/clinicflow-route-alignment-manifest.md",
    "docs/ui-ux/clinicflow-origin14-regression-analysis.md"
  ];

  for (const file of requiredDocs) {
    addCheck(
      `required origin-14 document exists: ${file}`,
      existsSync(projectPath(file))
    );
  }

  if (!existsSync(projectPath("AGENTS.md"))) return;

  const agents = readText("AGENTS.md");
  const agentsNeedles = [
    "ClinicFlow Origin-14 Design Rule",
    "demo-evidence/rebuild-tech-ui/all-pages-20260614-0400",
    "Global headers may contain only public navigation",
    "Minimalist Modern",
    "Origin-14 is the baseline, not the ceiling"
  ];
  for (const needle of agentsNeedles) {
    addCheck(`AGENTS.md contains guardrail: ${needle}`, agents.includes(needle));
  }

  const contractPath = "docs/ui-ux/clinicflow-current-design-contract.md";
  if (existsSync(projectPath(contractPath))) {
    const contract = readText(contractPath);
    addCheck(
      "design contract treats Minimalist Modern as supporting prompt only",
      contract.includes("Minimalist Modern") &&
        contract.includes("origin-14를 대체하지 않고 보강"),
      contractPath
    );
  }

  const designSystemPath = "docs/ui-ux/clinicflow-origin14-design-system.md";
  if (existsSync(projectPath(designSystemPath))) {
    const designSystem = readText(designSystemPath);
    const requiredSections = [
      "Product Design Principle",
      "Visual Identity",
      "Origin-14 Layout Archetypes",
      "Route Mapping",
      "Navigation Architecture",
      "Multi-step Flow Rules",
      "Component Rules",
      "UX Writing Rules",
      "Anti-Patterns",
      "Implementation Checklist"
    ];
    const missing = requiredSections.filter(
      (section) => !designSystem.includes(section)
    );
    addCheck(
      "Origin-14 design system contains required implementation sections",
      missing.length === 0,
      missing.join(", ")
    );
    addCheck(
      "Origin-14 design system treats Origin-14 as baseline not ceiling",
      designSystem.includes("Origin-14 is the baseline, not the ceiling") &&
        designSystem.includes("ClinicFlow Desktop Workbench v2"),
      designSystemPath
    );
  }

  const iaPlanPath = "docs/ui-ux/clinicflow-ia-navigation-refactor-plan.md";
  if (existsSync(projectPath(iaPlanPath))) {
    const iaPlan = readText(iaPlanPath);
    const normalizedIaPlan = iaPlan.toLowerCase();
    const requiredTopics = [
      "public header",
      "authenticated",
      "supervisee",
      "supervisor",
      "admin",
      "role guard",
      "release hygiene blocker"
    ];
    const missing = requiredTopics.filter((topic) => !normalizedIaPlan.includes(topic));
    addCheck(
      "IA/navigation plan covers role navigation and release hygiene",
      missing.length === 0,
      missing.join(", ")
    );
  }

  const hygienePath = "docs/ui-ux/clinicflow-release-hygiene-blockers.md";
  if (existsSync(projectPath(hygienePath))) {
    const hygiene = readText(hygienePath);
    addCheck(
      "release hygiene blockers document runtime and lint blockers",
      hygiene.includes("RH-001") &&
        hygiene.includes("RH-002") &&
        hygiene.includes("pnpm lint") &&
        hygiene.includes("pnpm dev:web"),
      hygienePath
    );
  }
}

function assertGlobalHeader() {
  const headerPath = "apps/web/src/components/clinicflow-shell.tsx";
  if (!existsSync(projectPath(headerPath))) {
    addCheck("global header component exists", false, headerPath);
    return;
  }

  const header = readText(headerPath);
  const forbiddenHeaderLabels = [
    "자료 제출",
    "자료 업로드",
    "현재 단계",
    "결제",
    "수락 대기",
    "학습 기록",
    "운영",
    "검토"
  ];
  const found = forbiddenHeaderLabels.filter((label) => header.includes(label));
  addCheck(
    "global public header excludes workflow/role navigation labels",
    found.length === 0,
    found.join(", ")
  );

  const expectedPublicLabels = [
    "슈퍼바이저 찾기",
    "이용 가이드",
    "로그인",
    "슈퍼비전 신청하기"
  ];
  const missing = expectedPublicLabels.filter((label) => !header.includes(label));
  addCheck(
    "global public header keeps approved labels",
    missing.length === 0,
    missing.join(", ")
  );
}

function assertRequestCreationStepDiscipline() {
  const formPath = "apps/web/src/app/(supervisee)/requests/new/new-request-form.tsx";
  if (!existsSync(projectPath(formPath))) {
    addCheck("request creation form exists", false, formPath);
    return;
  }

  const form = readText(formPath);
  const forbidden = ["자료 업로드", "현재 단계"];
  const found = forbidden.filter((label) => form.includes(label));

  addCheck(
    "request creation does not present itself as the material-upload screen",
    found.length === 0,
    found.join(", ")
  );

  const required = ["세션·일정", "사례자료 정리", "신청 초안 저장"];
  const missing = required.filter((label) => !form.includes(label));
  addCheck(
    "request creation keeps draft-first step language",
    missing.length === 0,
    missing.join(", ")
  );
}

function assertAuthenticatedNavigation() {
  const shellPath = "apps/web/src/components/app-shell.tsx";
  const menuPath = "apps/web/src/components/account-menu.tsx";
  const navPath = "apps/web/src/components/app-navigation.tsx";

  if (!existsSync(projectPath(shellPath)) || !existsSync(projectPath(menuPath))) {
    addCheck(
      "authenticated shell and account menu exist",
      false,
      `${shellPath}; ${menuPath}`
    );
    return;
  }

  const shell = readText(shellPath);
  const menu = readText(menuPath);
  const navigation = existsSync(projectPath(navPath)) ? readText(navPath) : "";

  addCheck(
    "authenticated shell shows persistent role navigation",
    shell.includes("AccountMenu") &&
      shell.includes("navigationForRole") &&
      shell.includes("currentUser") &&
      shell.includes("RoleNavigation") &&
      shell.includes("MobileRoleNavigation"),
    shellPath
  );

  addCheck(
    "account menu provides settings and logout",
    menu.includes("aria-current") &&
      menu.includes("계정 설정") &&
      menu.includes("로그아웃"),
    menuPath
  );

  addCheck(
    "role navigation defines supervisee supervisor and admin groups",
    navigation.includes("superviseeNavigation") &&
      navigation.includes("supervisorNavigation") &&
      navigation.includes("adminNavigation"),
    navPath
  );
}

function assertRoleGuardStates() {
  const routeFiles = walkFiles(
    "apps/web/src/app",
    (file) => /\.(tsx)$/.test(file) && !file.includes("/api/")
  );
  const weakRoleStates = [];

  for (const file of routeFiles) {
    const text = readFileSync(projectPath(file), "utf8");
    const calls = text.match(/<RoleRequiredState[\s\S]*?\/>/g) ?? [];
    for (const call of calls) {
      if (!call.includes("currentUser=")) {
        weakRoleStates.push(file);
        break;
      }
    }
  }

  addCheck(
    "role-required route states preserve current account context",
    weakRoleStates.length === 0,
    weakRoleStates.join(", ")
  );

  const supervisorSetupPages = [
    "apps/web/src/app/(supervisor)/supervisor/profile/page.tsx",
    "apps/web/src/app/(supervisor)/supervisor/availability/page.tsx",
    "apps/web/src/app/(supervisor)/supervisor/products/page.tsx"
  ];
  const missingErrorHandling = supervisorSetupPages.filter((file) => {
    if (!existsSync(projectPath(file))) return true;
    const text = readText(file);
    return (
      !text.includes("SupervisorPageLoadError") ||
      (!text.includes("ProductForm") &&
        !text.includes("AvailabilityForm") &&
        !text.includes("SupervisorProfileEditor"))
    );
  });

  addCheck(
    "supervisor setup pages have load-error and focused form/list structure",
    missingErrorHandling.length === 0,
    missingErrorHandling.join(", ")
  );
}

function assertVisualHygiene() {
  const sourceFiles = [
    ...walkFiles("apps/web/src/app", (file) => /\.(ts|tsx|css)$/.test(file)),
    ...walkFiles("apps/web/src/components", (file) => /\.(ts|tsx|css)$/.test(file)),
    ...walkFiles("apps/admin/src/app", (file) => /\.(ts|tsx|css)$/.test(file)),
    ...walkFiles("apps/admin/src/components", (file) => /\.(ts|tsx|css)$/.test(file)),
    ...walkFiles("packages/design-tokens/src", (file) => /\.(ts|tsx|css)$/.test(file))
  ].filter(
    (file) =>
      !file.includes("/api/") &&
      !file.includes(".test.") &&
      !file.includes(".integration.") &&
      !file.includes(".generated.")
  );

  const rules = [
    {
      name: "origin typography does not use portfolio/display font drift",
      pattern: /Calistoga|Hanken Grotesk|fontsource\/(?:hanken|inter)/
    },
    {
      name: "origin typography avoids negative tracking utilities",
      pattern: /tracking-\[-/
    },
    {
      name: "serious surfaces avoid oversized rounded-card drift",
      pattern: /rounded-3xl|rounded-\[(?:3[0-9]|4[0-9]|[5-9][0-9])px\]/
    },
    {
      name: "user-facing UI avoids rejected/internal labels",
      pattern:
        /페이지 이동|자료실|지도자|PHI|LOG|DB 환경|서명 URL|보안 로그인|데이터베이스|데이터 환경|서버 설정/
    }
  ];

  for (const rule of rules) {
    const matches = [];
    for (const file of sourceFiles) {
      const text = readFileSync(projectPath(file), "utf8");
      if (rule.pattern.test(text)) {
        matches.push(file);
      }
    }
    addCheck(rule.name, matches.length === 0, matches.join(", "));
  }
}

function assertAntiNoiseWarnings() {
  const sourceFiles = [
    ...walkFiles("apps/web/src/app", (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles("apps/web/src/components", (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles("apps/admin/src/app", (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles("apps/admin/src/components", (file) => /\.(ts|tsx)$/.test(file))
  ].filter((file) => !file.includes("/api/") && !file.includes(".test."));

  const nextActionMatches = [];
  const primaryActionPanelMatches = [];
  for (const file of sourceFiles) {
    const text = readFileSync(projectPath(file), "utf8");
    const nextActionCount = (text.match(/다음 행동/g) ?? []).length;
    if (nextActionCount > 0) {
      nextActionMatches.push(`${file} x${nextActionCount}`);
    }
    if (text.includes("PrimaryActionPanel")) {
      primaryActionPanelMatches.push(file);
    }
  }

  if (nextActionMatches.length > 0) {
    addWarning(
      "generic next-action copy remains in active app source",
      nextActionMatches.join("; ")
    );
  }

  if (primaryActionPanelMatches.length > 0) {
    addWarning(
      "PrimaryActionPanel usage requires blocking-action justification",
      primaryActionPanelMatches.join(", ")
    );
  }

  for (const file of [
    "apps/admin/src/app/admin/refunds/page.tsx",
    "apps/admin/src/app/admin/payouts/page.tsx",
    "apps/admin/src/app/admin/audit/page.tsx"
  ]) {
    if (!existsSync(projectPath(file))) continue;
    const count = (readText(file).match(/AdminCard/g) ?? []).length;
    if (count > 2) {
      addWarning(
        "admin operational page still leans on AdminCard",
        `${file} x${count}`
      );
    }
  }

  for (const file of [
    "apps/web/src/app/(supervisor)/supervisor/requests/page.tsx",
    "apps/web/src/app/(supervisor)/supervisor/products/page.tsx",
    "apps/web/src/app/(supervisor)/supervisor/payouts/page.tsx",
    "apps/admin/src/app/admin/refunds/page.tsx",
    "apps/admin/src/app/admin/payouts/page.tsx",
    "apps/admin/src/app/admin/audit/page.tsx"
  ]) {
    if (!existsSync(projectPath(file))) continue;
    const text = readText(file);
    if (/<(?:EmptyState|LoadingState)[^>]*variant=["']prominent["']/.test(text)) {
      addWarning("prominent state used on operational page", file);
    }
  }

  addWarning("anti-noise reminder", "Origin-14 is a baseline, not the ceiling.");
}

assertOriginScreens();
assertNoStaticPreviewRuntime();
assertRouteCoverage();
assertRouteManifestCoverage();
assertRouteArchetypeCoverage();
assertDocs();
assertGlobalHeader();
assertAuthenticatedNavigation();
assertRequestCreationStepDiscipline();
assertRoleGuardStates();
assertVisualHygiene();
assertAntiNoiseWarnings();

const failed = checks.filter((check) => check.status === "fail");
const report = {
  checkedAt: new Date().toISOString(),
  total: checks.length,
  pass: checks.length - failed.length,
  fail: failed.length,
  warning: warnings.length,
  checks,
  warnings
};

if (evidencePath) {
  mkdirSync(dirname(projectPath(evidencePath)), { recursive: true });
  writeFileSync(projectPath(evidencePath), `${JSON.stringify(report, null, 2)}\n`);
}

for (const check of checks) {
  const marker = check.status === "pass" ? "PASS" : "FAIL";
  const details = check.details ? ` - ${check.details}` : "";
  console.log(`${marker}: ${check.name}${details}`);
}

for (const warning of warnings) {
  const details = warning.details ? ` - ${warning.details}` : "";
  console.warn(`WARN: ${warning.name}${details}`);
}

if (failed.length > 0) {
  console.error(
    `Origin-14 guard failed: ${failed.length}/${checks.length} check(s) failed.`
  );
  process.exit(1);
}

console.log(`Origin-14 guard passed: ${checks.length}/${checks.length} check(s).`);
