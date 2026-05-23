import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page
} from "@playwright/test";
import { DEMO_IDS, DEMO_PASSWORD } from "../packages/db/src/dev-seed";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "demo-evidence/role-matrix-audit");
const screenshotDir = join(outDir, "screenshots");
const baseUrl = process.env["DEMO_BASE_URL"] ?? "http://localhost:3000";
const adminUrl = process.env["DEMO_ADMIN_URL"] ?? "http://localhost:3001";
const auditSlot = buildAuditSlot();

type Actor = "public" | "supervisee" | "supervisor" | "admin";
type Severity = "blocker" | "major" | "minor";

type Probe = {
  id: string;
  actor: Actor;
  url: string;
  title: string;
  expect?: RegExp;
  allowEnglish?: string[];
};

type ProbeResult = {
  id: string;
  actor: Actor;
  url: string;
  title: string;
  status: "ok" | "issue";
  httpStatus: number;
  findings: Finding[];
  screenshot: string;
};

type Finding = {
  severity: Severity;
  code: string;
  message: string;
};

const credentials: Record<Exclude<Actor, "public">, string> = {
  supervisee: "supervisee@demo.local",
  supervisor: "approved-sup@demo.local",
  admin: "admin@demo.local"
};

const globalEnglishAllow = [
  "ClinicFlow",
  "Google",
  "Calendar",
  "HIPAA",
  "PHI",
  "MMPI",
  "Rorschach",
  "CBT",
  "EMDR",
  "TAT",
  "BGT",
  "PDF",
  "DOCX",
  "URL",
  "API",
  "OAuth",
  "FreeBusy",
  "Toss",
  "Next",
  "PGlite",
  "Korea",
  "Asia/Seoul",
  "HWP/HWPX",
  "XLSX",
  "TXT",
  "Markdown",
  "JSON",
  "CSV",
  "PTSD",
  "CFClinicFlow",
  "person",
  "search",
  "verified",
  "star4.91",
  "star4.88",
  "star4.82",
  "star4.70",
  "star4.63",
  "star4.55",
  "star4.",
  "schedule",
  "school",
  "work",
  "badge",
  "payments",
  "check"
];

const bannedVisibleText = [
  "Create Account",
  "Join the",
  "Work Email",
  "Clinical Role",
  "Secure Login",
  "Find Supervisors",
  "My Requests",
  "Privacy Policy",
  "Terms of Service",
  "Security Standards",
  "Clinical Guidelines",
  "ClinicalSup",
  "Supervision Pro"
];

const supervisorIds = [
  DEMO_IDS.approvedSupervisorProfile,
  DEMO_IDS.traumaSupervisorProfile,
  DEMO_IDS.childSupervisorProfile,
  DEMO_IDS.neuroSupervisorProfile,
  DEMO_IDS.forensicSupervisorProfile,
  DEMO_IDS.geriatricSupervisorProfile
];

const requestIds = [
  DEMO_IDS.requestDraft,
  DEMO_IDS.requestSubmitted,
  DEMO_IDS.requestAwaitingPayment,
  DEMO_IDS.requestPaid,
  DEMO_IDS.requestInReview,
  DEMO_IDS.requestFeedback,
  DEMO_IDS.requestCompletion,
  DEMO_IDS.requestCompleted,
  DEMO_IDS.requestRejected
];

const probes: Probe[] = [
  {
    id: "public-home",
    actor: "public",
    url: "/",
    title: "홈",
    expect: /ClinicFlow|슈퍼비전/u
  },
  {
    id: "public-supervisors",
    actor: "public",
    url: "/supervisors",
    title: "슈퍼바이저 검색",
    expect: /임상 심리 전문가|검색/u
  },
  {
    id: "public-supervisors-query",
    actor: "public",
    url: "/supervisors?q=인지",
    title: "검색어 필터",
    expect: /인지|검색/u
  },
  {
    id: "public-supervisors-qualification",
    actor: "public",
    url: "/supervisors?qualification=정신건강임상심리사%201급",
    title: "자격 필터",
    expect: /자격|정신건강/u
  },
  {
    id: "public-supervisors-specialty",
    actor: "public",
    url: "/supervisors?specialty=neuropsych",
    title: "전문분야 필터",
    expect: /신경|인지|검색/u
  },
  {
    id: "public-supervisors-availability",
    actor: "public",
    url: "/supervisors?availability=this_week",
    title: "가능 일정 필터",
    expect: /가능|일정|검색/u
  },
  {
    id: "public-supervisors-page-2",
    actor: "public",
    url: "/supervisors?page=2",
    title: "검색 페이지네이션",
    expect: /임상 심리 전문가|조건에 맞는/u
  },
  ...supervisorIds.map((id, index) => ({
    id: `public-supervisor-${String(index + 1)}`,
    actor: "public" as const,
    url: `/supervisors/${id}`,
    title: `공개 프로필 ${String(index + 1)}`,
    expect: /소개|서비스 상품|가능 일정/u
  })),
  {
    id: "public-resources",
    actor: "public",
    url: "/resources",
    title: "자료실",
    expect: /자료실|비식별/u
  },
  {
    id: "public-privacy",
    actor: "public",
    url: "/privacy",
    title: "개인정보",
    expect: /개인정보|감사 기록/u
  },
  {
    id: "public-terms",
    actor: "public",
    url: "/terms",
    title: "이용약관",
    expect: /이용약관|환불/u
  },
  {
    id: "public-sensitive-consent",
    actor: "public",
    url: "/sensitive-consent",
    title: "민감정보 처리 동의",
    expect: /민감정보|감사 기록/u
  },
  {
    id: "public-security",
    actor: "public",
    url: "/security",
    title: "보안",
    expect: /보안|암호화/u
  },
  {
    id: "public-guidelines",
    actor: "public",
    url: "/clinical-guidelines",
    title: "임상 가이드",
    expect: /임상|비식별/u
  },
  {
    id: "public-login",
    actor: "public",
    url: "/login",
    title: "로그인",
    expect: /로그인|이메일/u
  },
  {
    id: "public-signup",
    actor: "public",
    url: "/signup",
    title: "가입",
    expect: /계정 만들기|가입/u
  },
  {
    id: "supervisee-requests",
    actor: "supervisee",
    url: "/requests",
    title: "내 의뢰",
    expect: /의뢰|전달한 문서/u
  },
  {
    id: "supervisee-new-basic",
    actor: "supervisee",
    url: "/requests/new",
    title: "새 의뢰",
    expect: /새로운 수퍼비전 요청|일정/u
  },
  {
    id: "supervisee-new-prefilled",
    actor: "supervisee",
    url: `/requests/new?supervisorId=${DEMO_IDS.approvedSupervisorProfile}&serviceProductId=${DEMO_IDS.productAsync}&slot=${encodeURIComponent(auditSlot.label)}&slotStart=${encodeURIComponent(auditSlot.startIso)}&slotEnd=${encodeURIComponent(auditSlot.endIso)}`,
    title: "일정 선택 후 의뢰",
    expect: /정확한 평가 전문가|보고서 코멘트|선택한 일정/u
  },
  ...requestIds.map((id, index) => ({
    id: `supervisee-request-${String(index + 1)}`,
    actor: "supervisee" as const,
    url: `/requests/${id}`,
    title: `슈퍼바이지 의뢰 상세 ${String(index + 1)}`,
    expect: /의뢰|문서|피드백|결제|검토/u
  })),
  {
    id: "supervisee-payments",
    actor: "supervisee",
    url: "/payments",
    title: "결제 목록",
    expect: /결제|영수증/u
  },
  {
    id: "supervisee-paid-payment",
    actor: "supervisee",
    url: `/payments/${DEMO_IDS.paymentPaid}`,
    title: "결제 상세",
    expect: /결제|금액|상태/u
  },
  {
    id: "supervisee-settings",
    actor: "supervisee",
    url: "/settings",
    title: "설정",
    expect: /설정|보안|계정/u
  },
  {
    id: "supervisor-home",
    actor: "supervisor",
    url: "/supervisor",
    title: "슈퍼바이저 홈",
    expect: /슈퍼바이저|요청|일정/u
  },
  {
    id: "supervisor-profile",
    actor: "supervisor",
    url: "/supervisor/profile",
    title: "프로필 관리",
    expect: /프로필|소개|저장/u
  },
  {
    id: "supervisor-qualifications",
    actor: "supervisor",
    url: "/supervisor/qualifications",
    title: "자격 관리",
    expect: /자격|승인|제출/u
  },
  {
    id: "supervisor-products",
    actor: "supervisor",
    url: "/supervisor/products",
    title: "상품 관리",
    expect: /상품|가격|저장/u
  },
  {
    id: "supervisor-availability",
    actor: "supervisor",
    url: "/supervisor/availability",
    title: "일정 관리",
    expect: /구글 캘린더|가능시간|저장/u
  },
  {
    id: "supervisor-requests",
    actor: "supervisor",
    url: "/supervisor/requests",
    title: "받은 의뢰",
    expect: /받은 자료|의뢰|검토/u
  },
  {
    id: "supervisor-payouts",
    actor: "supervisor",
    url: "/supervisor/payouts",
    title: "슈퍼바이저 정산",
    expect: /정산|지급|수익/u
  },
  ...[
    DEMO_IDS.requestSubmitted,
    DEMO_IDS.requestAwaitingPayment,
    DEMO_IDS.requestPaid,
    DEMO_IDS.requestCompleted
  ].map((id, index) => ({
    id: `supervisor-request-${String(index + 1)}`,
    actor: "supervisor" as const,
    url: `/supervisor/requests/${id}`,
    title: `슈퍼바이저 의뢰 상세 ${String(index + 1)}`,
    expect: /검토|자료|피드백|승인/u
  })),
  {
    id: "admin-home",
    actor: "admin",
    url: `${adminUrl}/admin`,
    title: "관리자 홈",
    expect: /관리|승인|환불|정산/u
  },
  {
    id: "admin-qualifications",
    actor: "admin",
    url: `${adminUrl}/admin/qualifications`,
    title: "자격 승인",
    expect: /자격|승인|반려/u
  },
  {
    id: "admin-refunds",
    actor: "admin",
    url: `${adminUrl}/admin/refunds`,
    title: "환불",
    expect: /환불|승인|반려/u
  },
  {
    id: "admin-payouts",
    actor: "admin",
    url: `${adminUrl}/admin/payouts`,
    title: "정산",
    expect: /정산|지급|계산/u
  },
  {
    id: "admin-audit",
    actor: "admin",
    url: `${adminUrl}/admin/audit`,
    title: "감사 로그",
    expect: /감사|로그|자료 접근/u
  },
  {
    id: "admin-root",
    actor: "admin",
    url: `${adminUrl}/`,
    title: "관리자 루트",
    expect: /관리|승인|환불|정산/u
  }
];

async function main() {
  mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const contexts = await createContexts(browser);
  const results: ProbeResult[] = [];

  try {
    for (const probe of probes) {
      const context = contexts[probe.actor];
      const page = await context.newPage();
      results.push(await runProbe(page, probe));
      await page.close();
    }
  } finally {
    await Promise.all(Object.values(contexts).map((context) => context.close()));
    await browser.close();
  }

  writeFileSync(
    join(outDir, "raw-results.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), count: results.length, results }, null, 2)}\n`
  );
  writeFileSync(join(outDir, "REPORT.md"), reportMarkdown(results));

  const issueCount = results.reduce((sum, result) => sum + result.findings.length, 0);
  const blockerCount = results.reduce(
    (sum, result) =>
      sum + result.findings.filter((finding) => finding.severity === "blocker").length,
    0
  );
  console.log(
    `role_matrix_audit probes=${String(results.length)} issues=${String(issueCount)} blockers=${String(blockerCount)}`
  );
  if (blockerCount > 0) {
    process.exitCode = 1;
  }
}

async function createContexts(
  browser: Browser
): Promise<Record<Actor, BrowserContext>> {
  const publicContext = await browser.newContext({
    viewport: { width: 1365, height: 900 }
  });
  const supervisee = await authenticatedContext(browser, "supervisee");
  const supervisor = await authenticatedContext(browser, "supervisor");
  const admin = await authenticatedContext(browser, "admin");
  return { public: publicContext, supervisee, supervisor, admin };
}

async function authenticatedContext(
  browser: Browser,
  actor: Exclude<Actor, "public">
): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  const ok = await page.evaluate(
    async ({ email, password }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      return response.ok;
    },
    { email: credentials[actor], password: DEMO_PASSWORD }
  );
  await page.close();
  if (!ok) {
    throw new Error(`${actor} login failed`);
  }
  return context;
}

async function runProbe(page: Page, probe: Probe): Promise<ProbeResult> {
  const findings: Finding[] = [];
  let httpStatus = 0;
  try {
    const response = await gotoWithRetry(page, probe.url);
    httpStatus = response?.status() ?? 0;
    await page.waitForTimeout(500);
  } catch (error) {
    findings.push({
      severity: "blocker",
      code: "navigation_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const screenshot = `screenshots/${probe.id}.png`;
  await page
    .screenshot({ path: join(outDir, screenshot), fullPage: true })
    .catch(() => undefined);

  if (httpStatus >= 500 || httpStatus === 0) {
    findings.push({
      severity: "blocker",
      code: "http_error",
      message: `페이지가 ${httpStatus === 0 ? "응답 없음" : String(httpStatus)} 상태로 열렸습니다.`
    });
  }

  const audit = await page
    .evaluate(() => {
      const text = document.body.innerText;
      const fakeLinks = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href="#"]')
      )
        .filter((link) => link.offsetParent !== null)
        .map((link) => link.innerText.trim() || link.getAttribute("aria-label") || "#")
        .slice(0, 8);
      const externalDemoImages = Array.from(document.images)
        .map((image) => image.currentSrc || image.src)
        .filter((src) => /aida-public|lh3\.googleusercontent\.com/u.test(src))
        .slice(0, 8);
      const disabledButtons = Array.from(
        document.querySelectorAll<HTMLButtonElement>("button:disabled")
      )
        .filter((button) => button.offsetParent !== null)
        .map((button) => button.innerText.trim())
        .filter(Boolean)
        .slice(0, 8);
      return { text, fakeLinks, externalDemoImages, disabledButtons };
    })
    .catch(() => ({
      text: "",
      fakeLinks: [],
      externalDemoImages: [],
      disabledButtons: []
    }));

  if (probe.expect && !probe.expect.test(audit.text)) {
    findings.push({
      severity: "major",
      code: "expected_copy_missing",
      message: `기대 문구가 보이지 않습니다: ${probe.expect.toString()}`
    });
  }

  if (
    probe.actor === "admin" &&
    audit.text.includes("관리자 계정으로 로그인해주세요")
  ) {
    findings.push({
      severity: "blocker",
      code: "admin_session_missing",
      message: "관리자 로그인 후에도 운영 화면이 인증된 세션으로 열리지 않았습니다."
    });
  }

  for (const phrase of bannedVisibleText) {
    if (audit.text.includes(phrase)) {
      findings.push({
        severity: "major",
        code: "english_or_old_brand_copy",
        message: `사용자 화면에 제거 대상 문구가 남아 있습니다: ${phrase}`
      });
    }
  }

  const unexpectedEnglish = findUnexpectedEnglish(audit.text, probe.allowEnglish ?? []);
  if (unexpectedEnglish.length > 0) {
    findings.push({
      severity: "minor",
      code: "english_copy_review",
      message: `한국어 UI 검토가 필요한 영문: ${unexpectedEnglish.join(", ")}`
    });
  }

  if (audit.fakeLinks.length > 0) {
    findings.push({
      severity: "major",
      code: "fake_href",
      message: `href="#" 링크가 남아 있습니다: ${audit.fakeLinks.join(", ")}`
    });
  }

  if (audit.externalDemoImages.length > 0) {
    findings.push({
      severity: "minor",
      code: "external_demo_image",
      message: `Stitch/demo 계열 외부 이미지가 남아 있습니다: ${String(audit.externalDemoImages.length)}개`
    });
  }

  if (
    probe.id === "public-signup" &&
    /역할|Clinical Role|슈퍼바이저로 가입/u.test(audit.text)
  ) {
    findings.push({
      severity: "blocker",
      code: "signup_role_choice",
      message: "가입 화면에서 역할 선택처럼 보이는 문구가 노출됩니다."
    });
  }

  if (
    probe.id === "supervisor-availability" &&
    !/\d{4}년|\d{1,2}월|\d{4}-\d{2}-\d{2}/u.test(audit.text)
  ) {
    findings.push({
      severity: "major",
      code: "calendar_context_missing",
      message: "일정 화면에서 월/날짜 맥락이 충분히 보이지 않습니다."
    });
  }

  if (
    probe.id === "supervisee-new-prefilled" &&
    !/슈퍼바이저\s*:/u.test(audit.text)
  ) {
    findings.push({
      severity: "major",
      code: "selected_supervisor_name_missing",
      message: "일정 선택 후 의뢰 화면에서 선택한 슈퍼바이저 이름을 확인할 수 없습니다."
    });
  }

  if (
    probe.id === "supervisee-new-prefilled" &&
    !/보고서 코멘트|₩\s*120,000/u.test(audit.text)
  ) {
    findings.push({
      severity: "major",
      code: "selected_product_summary_missing",
      message: "일정 선택 후 의뢰 화면에서 선택한 상품명과 금액을 확인하기 어렵습니다."
    });
  }

  return {
    id: probe.id,
    actor: probe.actor,
    url: probe.url,
    title: probe.title,
    status: findings.length === 0 ? "ok" : "issue",
    httpStatus,
    findings,
    screenshot
  };
}

async function gotoWithRetry(page: Page, url: string) {
  let response = await page.goto(resolveUrl(url), {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });
  if ((response?.status() ?? 0) >= 500) {
    await page.waitForTimeout(1_000);
    response = await page.goto(resolveUrl(url), {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
  }
  return response;
}

function findUnexpectedEnglish(text: string, extraAllow: string[]): string[] {
  const allowed = new Set([...globalEnglishAllow, ...extraAllow]);
  const textWithoutEmails = text.replace(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gu,
    ""
  );
  const matches = textWithoutEmails.match(/\b[A-Za-z][A-Za-z0-9/+.-]{2,}\b/g) ?? [];
  return Array.from(new Set(matches))
    .filter((word) => !allowed.has(word))
    .filter((word) => !/^(?=.*\d)[A-Fa-f0-9]{6,}$/u.test(word))
    .filter((word) => !/^(v\d+|\d+px)$/u.test(word))
    .slice(0, 10);
}

function resolveUrl(url: string): string {
  if (/^https?:\/\//u.test(url)) return url;
  return `${baseUrl}${url}`;
}

function buildAuditSlot(): { endIso: string; label: string; startIso: string } {
  const entropy = Date.now();
  const offsetWeeks = Math.floor(entropy / 1000) % 520;
  const minute = Math.floor(entropy / 17) % 60;
  const baseMondayKst = Date.parse("2026-06-01T00:00:00+09:00");
  const date = new Date(baseMondayKst + offsetWeeks * 7 * 24 * 60 * 60 * 1000);
  const dateLabel = formatKstDate(date);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short"
  }).format(date);
  const minuteLabel = String(minute).padStart(2, "0");
  const startIso = new Date(`${dateLabel}T10:${minuteLabel}:00+09:00`).toISOString();
  const endIso = new Date(`${dateLabel}T11:${minuteLabel}:00+09:00`).toISOString();

  return {
    endIso,
    label: `${dateLabel} ${weekday} 10:${minuteLabel}-11:${minuteLabel}`,
    startIso
  };
}

function formatKstDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value["year"]}-${value["month"]}-${value["day"]}`;
}

function reportMarkdown(results: ProbeResult[]): string {
  const issueResults = results.filter((result) => result.findings.length > 0);
  const counts = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.actor] = (acc[result.actor] ?? 0) + 1;
    return acc;
  }, {});

  const lines = [
    "# Role Matrix Audit",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Total probes: ${String(results.length)}`,
    `- Actor coverage: ${Object.entries(counts)
      .map(([actor, count]) => `${actor} ${String(count)}`)
      .join(", ")}`,
    `- Results with findings: ${String(issueResults.length)}`,
    "",
    "## Findings",
    ""
  ];

  if (issueResults.length === 0) {
    lines.push("No findings.");
  } else {
    for (const result of issueResults) {
      lines.push(`### ${result.id} (${result.actor})`);
      lines.push(`- URL: ${result.url}`);
      lines.push(`- Screenshot: ${result.screenshot}`);
      for (const finding of result.findings) {
        lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
      }
      lines.push("");
    }
  }

  lines.push("## Probe Inventory", "");
  for (const result of results) {
    lines.push(
      `- ${result.status === "ok" ? "OK" : "ISSUE"} ${result.id} ${result.actor} ${result.url}`
    );
  }

  return `${lines.join("\n")}\n`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
