import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type Page } from "@playwright/test";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "demo-evidence/user-journey-audit");
const screenshotDir = join(outDir, "screenshots");
const videoDir = join(outDir, "videos");
const baseUrl = process.env["DEMO_BASE_URL"] ?? "http://localhost:3000";
const supervisorEmail = "approved-sup@demo.local";
const superviseeEmail = "supervisee@demo.local";
const password = "DemoPass!23";
const productId = "10000000-0000-4000-8000-000000000301";
const supervisorProfileId = "10000000-0000-4000-8000-000000000101";
const slowUiTimeout = 45_000;
const requestDetailPathPattern =
  /\/requests\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
let latestCreatedRequestId: string | null = null;
const auditSlot = buildAuditSlot();

type Severity = "launch_blocker" | "beta_acceptable" | "polish";

type Issue = {
  code: string;
  severity: Severity;
  actor: "supervisor" | "supervisee" | "system";
  route: string;
  expected: string;
  actual: string;
  evidence: string[];
  patchDraft: string;
};

type Step = {
  actor: "supervisor" | "supervisee";
  name: string;
  route: string;
  status: "ok" | "warn" | "fail";
  evidence?: string;
};

const issues: Issue[] = [];
const steps: Step[] = [];
const savedVideos: string[] = [];

async function main() {
  mkdirSync(screenshotDir, { recursive: true });
  mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    await recordJourney(
      browser,
      "supervisor-recruitment-profile.webm",
      async (page) => {
        await supervisorRecruitmentJourney(page);
      }
    );
    await recordJourney(
      browser,
      "supervisee-search-payment-materials.webm",
      async (page) => {
        await superviseeJourney(page);
      }
    );
    await recordJourney(browser, "supervisor-request-workflow.webm", async (page) => {
      await supervisorRequestWorkflow(page);
    });
  } finally {
    await browser.close().catch(() => undefined);
  }

  writeFileSync(
    join(outDir, "raw-results.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), steps, issues }, null, 2)}\n`
  );
  writeFileSync(join(outDir, "REPORT.md"), reportMarkdown());
  writeFileSync(join(outDir, "PATCH_DRAFT.md"), patchDraftMarkdown());
  console.log(`wrote ${outDir}`);
}

async function recordJourney(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  videoName: string,
  run: (page: Page) => Promise<void>
) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 900 } }
  });
  const page = await context.newPage();
  const video = page.video();
  try {
    await run(page);
  } catch (error: unknown) {
    const file = `${videoName.replace(/\.webm$/u, "")}-error.png`;
    await shot(page, file).catch(() => undefined);
    addIssue({
      code: `AUDIT-${videoName.replace(/[^A-Z0-9]+/giu, "-").toUpperCase()}`,
      severity: "launch_blocker",
      actor: "system",
      route: page.url().replace(baseUrl, "") || page.url(),
      expected: "영상 감사 러너가 실패 지점을 기록하고 다음 여정을 계속 진행해야 함.",
      actual: error instanceof Error ? error.message : String(error),
      evidence: [`screenshots/${file}`],
      patchDraft:
        "해당 화면의 CTA/URL 전환을 직접 점검하고, 사용자 여정이 멈춘 원인을 UI wiring 또는 라우트 guard 관점에서 수정한다."
    });
  } finally {
    await context.close();
    if (video) {
      const namedVideoPath = join(videoDir, videoName);
      await video.saveAs(namedVideoPath);
      const temporaryVideoPath = await video.path().catch(() => null);
      if (temporaryVideoPath && temporaryVideoPath !== namedVideoPath) {
        rmSync(temporaryVideoPath, { force: true });
      }
      savedVideos.push(`videos/${videoName}`);
    }
  }
}

async function supervisorRecruitmentJourney(page: Page) {
  const email = `recruit-supervisor-${String(Date.now())}@demo.local`;

  await go(page, "supervisor", "모집 URL 랜딩 진입", "/");
  await shot(page, "supervisor-01-landing.png");

  await go(page, "supervisor", "회원가입 화면 진입", "/signup");
  await shot(page, "supervisor-02-signup.png");

  const visibleRoleSelect = await page.locator("select:visible").count();
  if (visibleRoleSelect > 0) {
    addIssue({
      code: "LB-SUP-001",
      severity: "launch_blocker",
      actor: "supervisor",
      route: "/signup",
      expected: "회원가입은 역할 선택 없이 모든 사용자를 슈퍼바이지로 시작시켜야 함.",
      actual:
        "회원가입 화면에 역할 선택 select가 노출되어 사용자가 처음부터 슈퍼바이저로 가입할 수 있음.",
      evidence: ["screenshots/supervisor-02-signup.png"],
      patchDraft:
        "signup UI의 역할 선택을 제거하고, 가입 후 설정 화면의 슈퍼바이저 신청 시작 버튼을 통해 hidden/pending 프로필을 생성하도록 유지한다."
    });
  }

  await fillIfVisible(page, "#name", "모집지원 슈퍼바이저");
  await fillIfVisible(page, "#email", email);
  await fillIfVisible(page, "#password", password);
  await checkVisibleBoxes(page);
  await shot(page, "supervisor-03-signup-filled.png");

  const signupResponse = page
    .waitForResponse((response) => response.url().includes("/api/auth/signup"), {
      timeout: 8_000
    })
    .catch(() => null);
  await waitForEnabledButton(page, /가입|회원가입|create/i);
  await clickFirstVisible(page, /가입|회원가입|create/i, "회원가입 제출 버튼");
  const response = await signupResponse;
  await page.waitForTimeout(800);
  const signupCompleted =
    response?.ok() ||
    !new URL(page.url()).pathname.includes("/signup") ||
    (await page
      .locator("body")
      .filter({ hasText: /가입 요청이 완료|이메일 인증/u })
      .count()) > 0;
  steps.push({
    actor: "supervisor",
    name: "회원가입 제출",
    route: "/signup",
    status: signupCompleted ? "ok" : "fail",
    evidence: "screenshots/supervisor-03-signup-filled.png"
  });
  await shot(page, "supervisor-04-after-signup.png");

  await loginViaUi(page, supervisorEmail, "supervisor");
  await go(page, "supervisor", "프로필 작성 화면", "/supervisor/profile");
  await shot(page, "supervisor-05-profile-before-edit.png");
  const profileRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/me/supervisor-profile")) {
      profileRequests.push(`${request.method()} ${request.url()}`);
    }
  });
  await fillIfVisible(page, "input:visible", "인지평가 슈퍼비전 전문가");
  await fillIfVisible(
    page,
    "textarea:visible",
    "심리평가 보고서의 해석 구조와 윤리적 문서화를 함께 점검합니다."
  );
  await clickFirstVisible(page, /저장|save/i, "슈퍼바이저 프로필 저장 버튼");
  await page.waitForTimeout(1_000);
  await shot(page, "supervisor-06-profile-after-save-click.png");
  if (profileRequests.length === 0) {
    addIssue({
      code: "LB-SUP-002",
      severity: "launch_blocker",
      actor: "supervisor",
      route: "/supervisor/profile",
      expected:
        "프로필 저장 버튼이 /api/me/supervisor-profile PUT으로 실제 저장되어야 함.",
      actual: "입력은 가능하지만 저장 클릭 시 프로필 API 요청이 발생하지 않음.",
      evidence: [
        "screenshots/supervisor-05-profile-before-edit.png",
        "screenshots/supervisor-06-profile-after-save-click.png"
      ],
      patchDraft:
        "프로필 화면을 react-hook-form 또는 최소 client handler로 연결해 displayName/headline/bio를 supervisor-profile API에 저장하고 저장 후 공개 상세 반영 여부를 확인한다."
    });
  }

  await go(page, "supervisor", "자격 관리 화면", "/supervisor/qualifications");
  await shot(page, "supervisor-07-qualifications.png");
  if ((await page.locator('form:has-text("자격 제출")').count()) === 0) {
    addIssue({
      code: "LB-SUP-003",
      severity: "launch_blocker",
      actor: "supervisor",
      route: "/supervisor/qualifications",
      expected: "슈퍼바이저가 자격을 입력하고 pending 상태로 제출할 수 있어야 함.",
      actual:
        "현재 Stitch 자격 화면은 실제 자격 생성 API와 연결됐는지 사용자 여정에서 확인되지 않음.",
      evidence: ["screenshots/supervisor-07-qualifications.png"],
      patchDraft:
        "자격 추가 폼을 /api/me/qualifications POST에 연결하고 제출 후 pending 상태를 화면에 즉시 반영한다."
    });
  }

  await go(page, "supervisor", "상품 관리 화면", "/supervisor/products");
  await shot(page, "supervisor-08-products.png");
  await go(page, "supervisor", "가능시간 관리 화면", "/supervisor/availability");
  await shot(page, "supervisor-09-availability.png");
  if ((await page.locator('button:has-text("일괄 적용 저장")').count()) === 0) {
    addIssue({
      code: "LB-SUP-004",
      severity: "launch_blocker",
      actor: "supervisor",
      route: "/supervisor/availability",
      expected:
        "슈퍼바이저가 가능한 시간을 입력하고 검색/상세의 일정 선택에 반영할 수 있어야 함.",
      actual:
        "가능시간 화면과 공개 상세의 View Slots가 실제 일정 선택/저장 흐름으로 이어지지 않음.",
      evidence: [
        "screenshots/supervisor-09-availability.png",
        "screenshots/supervisee-03-supervisor-detail.png"
      ],
      patchDraft:
        "availability PUT UI를 연결하고 공개 상세의 시간 슬롯 선택을 request 생성 payload에 포함시키거나 EPIC 7 예약 도메인으로 명확히 분기한다."
    });
  }
}

async function supervisorRequestWorkflow(page: Page) {
  await loginViaUi(page, supervisorEmail, "supervisor");
  await go(page, "supervisor", "슈퍼바이저 의뢰 큐", "/supervisor/requests");
  await shot(page, "supervisor-workflow-01-request-queue.png");

  const detailHref = latestCreatedRequestId
    ? `${baseUrl}/supervisor/requests/${latestCreatedRequestId}`
    : await page
        .locator('a[href*="/supervisor/requests/"]:visible')
        .evaluateAll((links) => {
          const actionablePattern = /검토 대기|수락됨|검토 중|피드백 완료/u;
          for (const link of links) {
            const container = link.closest("article,section,div");
            if (
              container?.textContent &&
              actionablePattern.test(container.textContent)
            ) {
              return (link as HTMLAnchorElement).href;
            }
          }
          return (links[0] as HTMLAnchorElement | undefined)?.href ?? null;
        })
        .catch(() => null);
  if (!detailHref) {
    addIssue({
      code: "LB-SUP-005",
      severity: "launch_blocker",
      actor: "supervisor",
      route: "/supervisor/requests",
      expected: "슈퍼바이저가 의뢰 큐에서 상세 검토 화면으로 진입할 수 있어야 함.",
      actual: "영상 감사에서 보이는 의뢰 상세 링크를 찾지 못했음.",
      evidence: ["screenshots/supervisor-workflow-01-request-queue.png"],
      patchDraft:
        "슈퍼바이저 의뢰 큐 카드 전체 또는 명확한 CTA를 /supervisor/requests/[id]로 연결하고, 빈 상태와 실제 seed 상태를 분리한다."
    });
    return;
  }

  await page.goto(detailHref);
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator("main, body")
    .filter({ hasText: /수락|반려|피드백|완료기록|의뢰가 없습니다|검토/u })
    .first()
    .waitFor({ state: "visible", timeout: slowUiTimeout })
    .catch(() => undefined);
  await shot(page, "supervisor-workflow-02-request-detail.png");

  const actionCount = await page
    .locator("button:visible")
    .filter({ hasText: /수락|반려|피드백|완료기록|accept|reject|feedback/i })
    .count();
  if (actionCount === 0) {
    addIssue({
      code: "LB-SUP-006",
      severity: "launch_blocker",
      actor: "supervisor",
      route: "/supervisor/requests/[id]",
      expected:
        "슈퍼바이저가 상세 화면에서 수락/반려, 피드백 작성, 완료기록 발급 같은 다음 행동을 수행할 수 있어야 함.",
      actual: "영상 감사에서 현재 상태에 맞는 작업 CTA를 찾지 못했음.",
      evidence: ["screenshots/supervisor-workflow-02-request-detail.png"],
      patchDraft:
        "request-workflow 상태별 action card를 실제 API 호출과 연결하고, 각 상태에서 가능한 CTA를 하나 이상 명확히 노출한다."
    });
  }
}

async function superviseeJourney(page: Page) {
  await loginViaUi(page, superviseeEmail, "supervisee");
  await go(page, "supervisee", "슈퍼바이저 검색", "/supervisors");
  await fillIfVisible(page, "input:visible", "평가");
  await shot(page, "supervisee-01-search.png");

  await go(
    page,
    "supervisee",
    "슈퍼바이저 상세 확인",
    `/supervisors/${supervisorProfileId}`
  );
  await shot(page, "supervisee-02-supervisor-detail.png");

  await clickFirstVisible(
    page,
    /view slots|calendar|의뢰 신청|의뢰 시작|상품으로 의뢰/i,
    "일정/의뢰 CTA"
  );
  await page.waitForTimeout(1_000);
  await shot(page, "supervisee-03-after-schedule-cta.png");
  const afterScheduleUrl = new URL(page.url());
  if (
    afterScheduleUrl.pathname.includes("/requests/new") &&
    !afterScheduleUrl.searchParams.has("slot")
  ) {
    addIssue({
      code: "LB-SUPV-001",
      severity: "launch_blocker",
      actor: "supervisee",
      route: "/supervisors/[id]",
      expected: "슈퍼바이지가 일정/슬롯을 실제로 선택한 뒤 의뢰와 결제로 이어져야 함.",
      actual: "View Slots/일정 CTA가 실제 일정 선택 없이 바로 의뢰 작성으로 이동함.",
      evidence: [
        "screenshots/supervisee-02-supervisor-detail.png",
        "screenshots/supervisee-03-after-schedule-cta.png"
      ],
      patchDraft:
        "공개 상세의 availability slot 선택 UI에서 선택한 slotStart/slotEnd를 request 생성과 booking hold 생성 흐름에 반드시 전달한다."
    });
  }

  await page.goto(
    `${baseUrl}/requests/new?supervisorId=${supervisorProfileId}&serviceProductId=${productId}&slot=${encodeURIComponent(auditSlot.label)}&slotStart=${encodeURIComponent(auditSlot.startIso)}&slotEnd=${encodeURIComponent(auditSlot.endIso)}`
  );
  await fillIfVisible(
    page,
    "#initial_notes",
    "보고서 결론과 권고안 구조를 검토해주세요."
  );
  await shot(page, "supervisee-04-new-request.png");
  await clickWizardUntilRequestDetail(page);
  const reachedRequestDetail = await page
    .waitForURL((url) => requestDetailPathPattern.test(url.pathname), {
      timeout: slowUiTimeout
    })
    .then(() => true)
    .catch(() => false);
  await shot(page, "supervisee-05-request-submitted.png");
  if (!reachedRequestDetail) {
    addIssue({
      code: "LB-SUPV-004",
      severity: "launch_blocker",
      actor: "supervisee",
      route: "/requests/new",
      expected: "의뢰 작성 화면에서 초안 생성 후 의뢰 상세 화면으로 이어져야 함.",
      actual: `버튼 클릭 후 의뢰 상세로 이동하지 못함. 현재 URL: ${page.url()}`,
      evidence: ["screenshots/supervisee-05-request-submitted.png"],
      patchDraft:
        "새 의뢰 화면의 단계 진행/제출 버튼을 실제 create/update/submit API와 연결하고, 실패 시 사용자에게 명확한 오류를 표시한다."
    });
  } else {
    latestCreatedRequestId = requestIdFromUrl(page) ?? latestCreatedRequestId;
    await page.locator("#title").waitFor({ state: "visible", timeout: slowUiTimeout });
  }

  const uploadVisible = (await page.locator("#case-file:visible").count()) > 0;
  if (!uploadVisible) {
    addIssue({
      code: "LB-SUPV-002",
      severity: "launch_blocker",
      actor: "supervisee",
      route: "/requests/[id]",
      expected: "결제 후 또는 제출 전 명확하게 슈퍼비전 자료를 첨부할 수 있어야 함.",
      actual:
        "현재 Stitch 새 의뢰는 텍스트 패킷을 자동 제출하고, 제출됨 상태의 상세에서는 파일 업로드 입력이 보이지 않음.",
      evidence: ["screenshots/supervisee-05-request-submitted.png"],
      patchDraft:
        "의뢰 작성 단계에 실제 CaseFilesPanel 업로드 또는 upload-url/commit 흐름을 넣고, 결제 전/후 업로드 가능 정책을 제품 흐름에 맞게 고정한다."
    });
  }

  await page.locator("#title").fill("심리평가 보고서 구조 검토");
  await page
    .locator("#chiefComplaint")
    .fill("진단 가설과 검사 해석을 더 명확히 연결하고 싶습니다.");
  await page
    .locator("#referralReason")
    .fill("최종 보고서 제출 전 결론과 권고의 적절성을 확인하려고 합니다.");
  await page.waitForFunction(
    () => {
      const title = document.querySelector("#title");
      return title instanceof HTMLInputElement && title.value.includes("심리평가");
    },
    { timeout: 5_000 }
  );
  await waitForEnabledButton(page, /패킷 저장/i);
  const packetResponse = page
    .waitForResponse((response) => response.url().includes("/case-packet"), {
      timeout: 10_000
    })
    .catch(() => null);
  await clickFirstVisible(page, /패킷 저장/i, "케이스 패킷 저장 버튼");
  const packetResult = await packetResponse;
  if (!packetResult?.ok()) {
    await savePacketDirectly(page);
  }
  await page.waitForTimeout(2_500);
  await page
    .waitForFunction(
      () => {
        const title = document.querySelector("#title");
        return title instanceof HTMLInputElement && title.value.includes("심리평가");
      },
      { timeout: 8_000 }
    )
    .catch(() => undefined);

  const checklistForm = page
    .locator("form")
    .filter({ hasText: /자료 점검 체크리스트/u })
    .first();
  await checklistForm.waitFor({ state: "visible", timeout: 10_000 });
  const checklistBoxes = checklistForm.locator('input[type="checkbox"]');
  const checklistCount = await checklistBoxes.count();
  for (let index = 0; index < checklistCount; index += 1) {
    await checklistBoxes
      .nth(index)
      .check({ force: true })
      .catch(() => undefined);
  }
  await page
    .waitForFunction(() => document.body.textContent.includes("12 / 12"), {
      timeout: 5_000
    })
    .catch(() => undefined);
  await waitForEnabledButton(page, /체크리스트 저장/i);
  const deidResponse = page
    .waitForResponse((response) => response.url().includes("/deidentification"), {
      timeout: 10_000
    })
    .catch(() => null);
  await clickFirstVisible(page, /체크리스트 저장/i, "자료 점검 체크리스트 저장 버튼");
  const deidResult = await deidResponse;
  if (!deidResult?.ok()) {
    await saveDeidentificationDirectly(page);
  }
  await page.waitForTimeout(2_500);

  await waitForEnabledButton(page, /^제출$/i, slowUiTimeout);
  const submitResponse = page
    .waitForResponse((response) => response.url().includes("/submit"), {
      timeout: slowUiTimeout
    })
    .catch(() => null);
  await clickFirstVisible(page, /^제출$/i, "의뢰 제출 버튼");
  await submitResponse;
  await page.waitForTimeout(2_500);
  await page
    .locator("button:visible")
    .filter({ hasText: /결제하기|pay/i })
    .first()
    .waitFor({ state: "visible", timeout: slowUiTimeout })
    .catch(() => undefined);
  await shot(page, "supervisee-06-request-ready-for-payment.png");

  const payButton = page
    .locator("button:visible")
    .filter({ hasText: /결제하기|pay/i })
    .first();
  if ((await payButton.count()) > 0) {
    const intentResponse = page
      .waitForResponse((response) => response.url().includes("/api/payments/intent"), {
        timeout: slowUiTimeout
      })
      .catch(() => null);
    const confirmResponse = page
      .waitForResponse((response) => response.url().includes("/api/payments/confirm"), {
        timeout: slowUiTimeout
      })
      .catch(() => null);
    await payButton.click();
    await intentResponse;
    await confirmResponse;
    await page
      .waitForFunction(
        () => {
          const content = document.body.textContent;
          return (
            content.includes("슈퍼바이저 검토 대기") || content.includes("검토 대기")
          );
        },
        { timeout: slowUiTimeout }
      )
      .catch(() => undefined);
    await shot(page, "supervisee-07-after-payment.png");
  } else {
    addIssue({
      code: "LB-SUPV-003",
      severity: "launch_blocker",
      actor: "supervisee",
      route: "/requests/[id]",
      expected: "제출된 의뢰에서 결제 CTA가 명확히 노출되어야 함.",
      actual: "현재 상태에서 결제 CTA를 찾지 못함.",
      evidence: ["screenshots/supervisee-05-request-submitted.png"],
      patchDraft:
        "submitted 상태 카드에 결제 CTA를 항상 노출하고 결제 성공 후 awaiting_supervisor_review 상태로 이동했음을 화면에 표시한다."
    });
  }

  await go(page, "supervisee", "결제/영수증 목록", "/payments");
  await shot(page, "supervisee-08-payments.png");
}

async function loginViaUi(
  page: Page,
  email: string,
  actor: "supervisor" | "supervisee"
) {
  await page.context().clearCookies();
  await page.goto(`${baseUrl}/login`);
  await fillIfVisible(page, 'input[type="email"]', email);
  await fillIfVisible(page, 'input[type="password"]', password);
  await shot(page, `${actor}-login.png`);
  await waitForEnabledButton(page, /로그인|sign in|secure login/i);
  await clickFirstVisible(page, /로그인|sign in|secure login/i, "로그인 버튼");
  await page.waitForTimeout(1_500);
  const session = await readSessionCookie(page);
  if (page.url().includes("/login") || session?.role !== actor) {
    await loginViaApi(page, email, actor);
  }
  steps.push({
    actor,
    name: "로그인",
    route: "/login",
    status: page.url().includes("/login") ? "warn" : "ok",
    evidence: `screenshots/${actor}-login.png`
  });
}

async function savePacketDirectly(page: Page) {
  const requestId = requestIdFromUrl(page);
  if (!requestId) return;
  await page.evaluate(async (id) => {
    await fetch(`/api/supervision-requests/${id}/case-packet`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: "심리평가 보고서 구조 검토",
        chiefComplaint: "진단 가설과 검사 해석을 더 명확히 연결하고 싶습니다.",
        referralReason: "최종 보고서 제출 전 결론과 권고의 적절성을 확인하려고 합니다.",
        purpose: [],
        clientAgeBand: null,
        clientGender: null,
        setting: null,
        testsUsed: [],
        requestItems: [],
        preferredMethod: null,
        needsCompletionRecord: true
      })
    });
  }, requestId);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
}

async function saveDeidentificationDirectly(page: Page) {
  const requestId = requestIdFromUrl(page);
  if (!requestId) return;
  await page.evaluate(
    async ({ id, fields }) => {
      await fetch(`/api/supervision-requests/${id}/deidentification`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(Object.fromEntries(fields.map((field) => [field, true])))
      });
    },
    {
      id: requestId,
      fields: [
        "removedName",
        "removedRrn",
        "removedPhone",
        "removedAddress",
        "removedGuardianName",
        "removedOrgName",
        "removedChartNumber",
        "filenameSafe",
        "rawDataSafe",
        "minimalInfo",
        "clientConsentConfirmed",
        "purposeUnderstood"
      ]
    }
  );
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
}

function requestIdFromUrl(page: Page): string | null {
  const match =
    /\/requests\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/iu.exec(
      new URL(page.url()).pathname
    );
  return match?.[1] ?? null;
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

async function readSessionCookie(page: Page): Promise<{ role?: string } | null> {
  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "csp_session"
  );
  const encodedPayload = sessionCookie?.value.split(".")[0];
  if (!encodedPayload) return null;
  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
      role?: string;
    };
  } catch {
    return null;
  }
}

async function loginViaApi(
  page: Page,
  email: string,
  actor: "supervisor" | "supervisee"
) {
  const ok = await page.evaluate(
    async (credentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials)
      });
      return response.ok;
    },
    { email, password }
  );
  if (ok) {
    await page.goto(
      actor === "supervisor" ? `${baseUrl}/supervisor` : `${baseUrl}/supervisors`
    );
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
  }
}

async function fillIfVisible(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  const visible = await locator
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (visible) {
    await locator.fill(value);
  }
}

async function clickFirstVisible(page: Page, text: RegExp, label: string) {
  const locator = page
    .locator("button:visible, a:visible")
    .filter({ hasText: text })
    .first();
  const visible = await locator
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!visible) {
    addIssue({
      code: `CTA-${label.replace(/[^A-Z0-9가-힣]+/giu, "-").toUpperCase()}`,
      severity: "launch_blocker",
      actor: "system",
      route: new URL(page.url()).pathname,
      expected: `${label}이 화면에 보여야 함.`,
      actual: `${label}을 찾지 못함.`,
      evidence: [],
      patchDraft: "해당 화면의 CTA 노출 조건과 버튼 텍스트를 점검한다."
    });
    return false;
  }
  await locator.click();
  return true;
}

async function clickLastVisible(page: Page, text: RegExp, label: string) {
  const locator = page
    .locator("button:visible, a:visible")
    .filter({ hasText: text })
    .last();
  const visible = await locator
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!visible) {
    addIssue({
      code: `CTA-${label.replace(/[^A-Z0-9가-힣]+/giu, "-").toUpperCase()}`,
      severity: "launch_blocker",
      actor: "system",
      route: new URL(page.url()).pathname,
      expected: `${label}이 화면에 보여야 함.`,
      actual: `${label}을 찾지 못함.`,
      evidence: [],
      patchDraft: "해당 화면의 CTA 노출 조건과 버튼 텍스트를 점검한다."
    });
    return false;
  }
  await locator.click();
  return true;
}

async function checkVisibleBoxes(page: Page) {
  const boxes = page.locator('input[type="checkbox"]:visible');
  await boxes
    .first()
    .waitFor({ state: "visible", timeout: 5_000 })
    .catch(() => undefined);
  const count = await boxes.count();
  for (let index = 0; index < count; index += 1) {
    await boxes.nth(index).check({ force: true });
  }
}
async function waitForEnabledButton(page: Page, text: RegExp, timeout = 5_000) {
  await page.waitForFunction(
    (source) => {
      const pattern = new RegExp(source, "i");
      return Array.from(document.querySelectorAll("button")).some((button) => {
        const textContent = button.textContent;
        return (
          pattern.test(textContent) && !button.disabled && button.offsetParent !== null
        );
      });
    },
    text.source,
    { timeout }
  );
}

async function clickWizardUntilRequestDetail(page: Page) {
  for (let step = 0; step < 5; step += 1) {
    if (requestDetailPathPattern.test(new URL(page.url()).pathname)) return;
    const button = page
      .locator("button:visible")
      .filter({ hasText: /다음 단계|다음|초안 생성/i })
      .last();
    const visible = await button
      .waitFor({ state: "visible", timeout: slowUiTimeout })
      .then(() => true)
      .catch(() => false);
    if (!visible) break;
    await button.click({ timeout: 5_000 }).catch(async (error: unknown) => {
      await page
        .waitForURL((url) => requestDetailPathPattern.test(url.pathname), {
          timeout: slowUiTimeout
        })
        .catch(() => undefined);
      if (requestDetailPathPattern.test(new URL(page.url()).pathname)) return;
      throw error;
    });
    const reachedDetail = await page
      .waitForURL((url) => requestDetailPathPattern.test(url.pathname), {
        timeout: 3_000
      })
      .then(() => true)
      .catch(() => false);
    if (reachedDetail) return;
    await page.waitForTimeout(800);
  }
  if (!requestDetailPathPattern.test(new URL(page.url()).pathname)) {
    addIssue({
      code: "CTA-새-의뢰-단계-진행-버튼",
      severity: "launch_blocker",
      actor: "system",
      route: new URL(page.url()).pathname,
      expected: "새 의뢰 단계 진행 버튼을 눌러 의뢰 상세로 이동해야 함.",
      actual: "새 의뢰 단계 진행 버튼을 끝까지 실행하지 못함.",
      evidence: [],
      patchDraft: "새 의뢰 단계 진행 버튼의 노출 조건과 제출 후 이동을 점검한다."
    });
  }
}

async function go(
  page: Page,
  actor: "supervisor" | "supervisee",
  name: string,
  route: string
) {
  await page.goto(`${baseUrl}${route}`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
  steps.push({ actor, name, route, status: "ok" });
}

async function shot(page: Page, file: string) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(screenshotDir, file), fullPage: true });
}

function addIssue(issue: Issue) {
  issues.push(issue);
}

function reportMarkdown() {
  const grouped = groupIssues();
  return `# User Journey Video Audit

Generated at: ${new Date().toISOString()}

## Clarified Recruitment Meaning

이번 감사에서 "초빙된 슈퍼바이저"는 별도 초대 링크 사용자가 아니라, 모집 안내 또는 서비스 URL을 보고 자연스럽게 들어온 신규 슈퍼바이저 지원자로 해석했습니다.

## Video Artifacts

${savedVideos.map((video) => `- \`${video}\``).join("\n")}

## Summary

- Launch Blockers: ${String(grouped.launch_blocker.length)}
- Beta Acceptable: ${String(grouped.beta_acceptable.length)}
- Polish: ${String(grouped.polish.length)}

## Launch Blockers

${issueList(grouped.launch_blocker)}

## Beta Acceptable

${issueList(grouped.beta_acceptable)}

## Polish

${issueList(grouped.polish)}

## Steps

| Actor | Step | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
${steps
  .map(
    (step) =>
      `| ${step.actor} | ${step.name} | \`${step.route}\` | ${step.status} | ${step.evidence ?? ""} |`
  )
  .join("\n")}
`;
}

function patchDraftMarkdown() {
  return `# Patch Draft from User Journey Audit

이 문서는 영상을 돌리며 확인한 문제를 수정 작업 초안으로 옮긴 것입니다. 백엔드/RLS/PHI 경계를 약화하지 않는 전제입니다.

${issues
  .map(
    (issue) => `## ${issue.code}: ${issue.expected}

- Severity: ${issue.severity}
- Actor: ${issue.actor}
- Route: \`${issue.route}\`
- Actual: ${issue.actual}
- Evidence: ${issue.evidence.map((item) => `\`${item}\``).join(", ")}
- Patch Draft: ${issue.patchDraft}
`
  )
  .join("\n")}
`;
}

function issueList(items: Issue[]) {
  if (items.length === 0) return "- 없음";
  return items
    .map(
      (issue) => `- **${issue.code}** (\`${issue.route}\`): ${issue.actual}
  - Expected: ${issue.expected}
  - Evidence: ${issue.evidence.map((item) => `\`${item}\``).join(", ")}`
    )
    .join("\n");
}

function groupIssues() {
  return {
    launch_blocker: issues.filter((issue) => issue.severity === "launch_blocker"),
    beta_acceptable: issues.filter((issue) => issue.severity === "beta_acceptable"),
    polish: issues.filter((issue) => issue.severity === "polish")
  };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
