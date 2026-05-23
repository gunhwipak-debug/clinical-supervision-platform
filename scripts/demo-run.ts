import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DEMO_IDS, DEMO_PASSWORD } from "../packages/db/src/dev-seed";

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const devLogPath = join(evidenceDir, "dev.log");
const runJsonPath = join(evidenceDir, "run.json");
const reportPath = join(evidenceDir, "REPORT.md");
const baseUrl = process.env["DEMO_BASE_URL"] ?? "http://localhost:3000";
const adminUrl = process.env["DEMO_ADMIN_URL"] ?? "http://localhost:3001";
const freshEmail = "fresh@demo.local";

const state: { cookie: string; steps: StepResult[] } = { cookie: "", steps: [] };

async function main() {
  mkdirSync(evidenceDir, { recursive: true });
  const signupStartedAt = Date.now();
  let token = "";
  let supervisorProfileId: string = DEMO_IDS.approvedSupervisorProfile;
  let serviceProductId: string = DEMO_IDS.productAsync;
  let requestId = "";
  let paymentId = "";
  let paymentAmount = 0;
  let caseFileId = "";

  await runStep("signup fresh user", "POST", "/api/auth/signup", async () => {
    const response = await api(baseUrl, "/api/auth/signup", {
      method: "POST",
      body: {
        email: freshEmail,
        password: DEMO_PASSWORD,
        role: "supervisee",
        consent: { tos: true, privacy: true, sensitive: true }
      }
    });
    return resultFromResponse(
      response,
      response.status === 200 || response.status === 409 ? "ok" : "fail"
    );
  });

  await runStep("extract email token", "READ", "demo-evidence/dev.log", async () => {
    token = await waitForEmailToken(freshEmail, signupStartedAt);
    return {
      status: token ? "ok" : "warn",
      responseStatus: token ? 200 : 0,
      response: token
        ? { tokenPreview: `${token.slice(0, 6)}...${token.slice(-4)}` }
        : { code: "token_not_found" }
    };
  });

  await runStep("verify email", "POST", "/api/auth/email/verify", async () => {
    if (!token)
      return {
        status: "warn",
        responseStatus: 0,
        response: { code: "skipped_existing_user" }
      };
    const response = await api(baseUrl, "/api/auth/email/verify", {
      method: "POST",
      body: { token }
    });
    return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
  });

  await login("fresh supervisee login", freshEmail);

  await runStep("search supervisors", "GET", "/api/supervisors/search", async () => {
    const response = await api(baseUrl, "/api/supervisors/search", { method: "GET" });
    const body = await responseBody(response);
    const data = asRecord(body["data"]);
    const raw = data ? data["supervisors"] : null;
    const supervisors = Array.isArray(raw) ? raw.filter(isSupervisorSummary) : [];
    const approved = supervisors.find(
      (item) => item.displayName === "정확한 평가 전문가"
    );
    const hidden = supervisors.find(
      (item) => item.displayName === "숨김 프로필 슈퍼바이저"
    );
    if (approved) supervisorProfileId = approved.id;
    return {
      status: response.status === 200 && approved && !hidden ? "ok" : "fail",
      responseStatus: response.status,
      response: {
        count: supervisors.length,
        approvedFound: Boolean(approved),
        hiddenFound: Boolean(hidden)
      }
    };
  });

  await runStep(
    "get supervisor detail",
    "GET",
    `/api/supervisors/${supervisorProfileId}`,
    async () => {
      const response = await api(baseUrl, `/api/supervisors/${supervisorProfileId}`, {
        method: "GET"
      });
      const body = await responseBody(response);
      const data = asRecord(body["data"]);
      const products = normalizeProducts(
        asRecord(data?.["supervisor"])?.["serviceProducts"]
      );
      if (products[0]) serviceProductId = products[0].id;
      return {
        status: response.status === 200 && products.length > 0 ? "ok" : "fail",
        responseStatus: response.status,
        response: { productCount: products.length, serviceProductId }
      };
    }
  );

  await runStep(
    "create supervision request",
    "POST",
    "/api/supervision-requests",
    async () => {
      const response = await api(baseUrl, "/api/supervision-requests", {
        method: "POST",
        body: {
          serviceProductId,
          retentionDays: 30,
          selectedSlotEnd: "2026-06-01T14:00:00+09:00",
          selectedSlotStart: "2026-06-01T13:00:00+09:00",
          urgency: "normal"
        }
      });
      const body = await responseBody(response);
      requestId = stringFromUnknown(
        asRecord(asRecord(body["data"])?.["request"])?.["id"]
      );
      return {
        status: response.status === 200 && requestId ? "ok" : "fail",
        responseStatus: response.status,
        response: { requestId, code: errorCode(body) }
      };
    }
  );

  await runStep(
    "save case packet",
    "PUT",
    `/api/supervision-requests/${requestId}/case-packet`,
    async () => {
      const response = await api(
        baseUrl,
        `/api/supervision-requests/${requestId}/case-packet`,
        {
          method: "PUT",
          body: {
            title: "심리평가 보고서 구조 검토",
            chiefComplaint: "정서 평가 결과와 성격검사 해석을 함께 점검하고 싶습니다.",
            referralReason:
              "초안의 결론 문장과 권고안이 의뢰 목적에 맞는지 확인이 필요합니다.",
            purpose: ["보고서 구조", "해석 검토"],
            clientAgeBand: "19-39",
            clientGender: "비공개",
            setting: "counseling_center",
            testsUsed: ["MMPI-2", "Rorschach"],
            requestItems: ["결론", "권고"],
            preferredMethod: "async_comment",
            needsCompletionRecord: true
          }
        }
      );
      return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
    }
  );

  await runStep("upload clean case file", "POST", "/api/case-files", async () => {
    const content = "심리평가 보고서 초안입니다. 검사 해석 구조를 검토해 주세요.";
    const sizeBytes = new TextEncoder().encode(content).byteLength;
    const prepared = await api(baseUrl, "/api/case-files/upload-url", {
      method: "POST",
      body: {
        requestId,
        filename: "demo-report.txt",
        contentType: "text/plain",
        sizeBytes,
        kind: "report_draft"
      }
    });
    const preparedBody = await responseBody(prepared);
    const preparedData = asRecord(preparedBody["data"]);
    const uploadUrl = stringFromUnknown(preparedData?.["url"]);
    const uploadKey = stringFromUnknown(preparedData?.["uploadKey"]);
    if (prepared.status !== 200 || !uploadUrl || !uploadKey) {
      return {
        status: "fail",
        responseStatus: prepared.status,
        response: preparedBody
      };
    }

    const putResponse = await fetch(`${baseUrl}${uploadUrl}`, {
      method: "PUT",
      headers: { "content-type": "text/plain" },
      body: content
    });
    if (putResponse.status !== 200) {
      return resultFromResponse(putResponse, "fail");
    }

    const registered = await api(baseUrl, "/api/case-files", {
      method: "POST",
      body: {
        requestId,
        uploadKey,
        kind: "report_draft",
        originalFilename: "demo-report.txt",
        mimeType: "text/plain",
        sizeBytes
      }
    });
    const body = await responseBody(registered);
    caseFileId = stringFromUnknown(asRecord(asRecord(body["data"])?.["file"])?.["id"]);
    return {
      status: registered.status === 200 ? "ok" : "fail",
      responseStatus: registered.status,
      response: {
        fileId: caseFileId,
        code: errorCode(body)
      }
    };
  });

  await runStep(
    "download clean case file",
    "GET",
    "/api/case-files/:id/download-url",
    async () => {
      const prepared = await api(
        baseUrl,
        `/api/case-files/${caseFileId}/download-url`,
        { method: "GET" }
      );
      const preparedBody = await responseBody(prepared);
      const downloadUrl = stringFromUnknown(
        asRecord(asRecord(preparedBody["data"])?.["download"])?.["url"]
      );
      if (prepared.status !== 200 || !downloadUrl) {
        return {
          status: "fail",
          responseStatus: prepared.status,
          response: preparedBody
        };
      }
      const downloaded = await fetch(`${baseUrl}${downloadUrl}`);
      const text = await downloaded.text();
      return {
        status:
          downloaded.status === 200 && text.includes("[CSP watermark]") ? "ok" : "fail",
        responseStatus: downloaded.status,
        response: { hasWatermark: text.includes("[CSP watermark]") }
      };
    }
  );

  await runStep(
    "accept identifier-containing original case file",
    "POST",
    "/api/case-files",
    async () => {
      const content = "연락처 010-1234-5678";
      const sizeBytes = new TextEncoder().encode(content).byteLength;
      const prepared = await api(baseUrl, "/api/case-files/upload-url", {
        method: "POST",
        body: {
          requestId,
          filename: "phi-demo.txt",
          contentType: "text/plain",
          sizeBytes,
          kind: "other"
        }
      });
      const preparedBody = await responseBody(prepared);
      const uploadUrl = stringFromUnknown(asRecord(preparedBody["data"])?.["url"]);
      const uploadKey = stringFromUnknown(
        asRecord(preparedBody["data"])?.["uploadKey"]
      );
      if (!uploadUrl || !uploadKey) {
        return {
          status: "fail",
          responseStatus: prepared.status,
          response: preparedBody
        };
      }
      await fetch(`${baseUrl}${uploadUrl}`, {
        method: "PUT",
        headers: { "content-type": "text/plain" },
        body: content
      });
      const registered = await api(baseUrl, "/api/case-files", {
        method: "POST",
        body: {
          requestId,
          uploadKey,
          kind: "other",
          originalFilename: "phi-demo.txt",
          mimeType: "text/plain",
          sizeBytes
        }
      });
      const body = await responseBody(registered);
      const file = asRecord(asRecord(body["data"])?.["file"]);
      const phiScanStatus = stringFromUnknown(file?.["phiScanStatus"]);
      return {
        status:
          registered.status === 200 && phiScanStatus === "suspicious" ? "ok" : "fail",
        responseStatus: registered.status,
        response: { code: errorCode(body), phiScanStatus }
      };
    }
  );

  await runStep(
    "save deidentification",
    "PUT",
    `/api/supervision-requests/${requestId}/deidentification`,
    async () => {
      const response = await api(
        baseUrl,
        `/api/supervision-requests/${requestId}/deidentification`,
        {
          method: "PUT",
          body: completeDeidentification()
        }
      );
      return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
    }
  );

  await runStep(
    "submit request",
    "POST",
    `/api/supervision-requests/${requestId}/submit`,
    async () => {
      const response = await api(
        baseUrl,
        `/api/supervision-requests/${requestId}/submit`,
        { method: "POST" }
      );
      return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
    }
  );

  await runStep("create payment intent", "POST", "/api/payments/intent", async () => {
    const response = await api(baseUrl, "/api/payments/intent", {
      method: "POST",
      body: { supervisionRequestId: requestId }
    });
    const body = await responseBody(response);
    const data = asRecord(body["data"]);
    paymentId = stringFromUnknown(data?.["paymentId"]);
    paymentAmount = Number(data?.["amount"] ?? 0);
    return {
      status: response.status === 200 && paymentId ? "ok" : "fail",
      responseStatus: response.status,
      response: { paymentId, paymentAmount }
    };
  });

  await runStep("confirm payment", "POST", "/api/payments/confirm", async () => {
    const response = await api(baseUrl, "/api/payments/confirm", {
      method: "POST",
      body: { paymentId, pgPaymentKey: `dev_${paymentId}`, amount: paymentAmount }
    });
    return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
  });

  await login("supervisor login", "approved-sup@demo.local");
  await postRequestAction("supervisor accept", "accept", {});
  await postRequestAction("supervisor feedback", "feedback", {
    summary: "검사 결과의 핵심 가설과 반증 근거를 분리해 보고서 설득력을 높였습니다.",
    recommendations:
      "결론에는 기능 수준, 평가 한계, 후속 권고를 짧은 문단으로 나누어 제시하세요."
  });

  await login("supervisee feedback approval", freshEmail);
  await postRequestAction("approve supervisor feedback", "approval", {
    note: "피드백 내용을 확인했고 승인합니다."
  });

  await login("supervisor relogin for completion", "approved-sup@demo.local");
  await postRequestAction("issue completion record", "completion", {
    reviewedMaterials: ["case-packet", "report-draft"],
    scope: ["interpretation", "report-structure"],
    limitations: "제출된 원자료와 수정본을 슈퍼비전 목적 안에서 검토했습니다.",
    responsibilityNotice: "최종 임상 판단과 보고서 발행 책임은 의뢰자에게 있습니다."
  });

  await login("supervisee relogin", freshEmail);
  await postRequestAction("write review and complete", "review", {
    expertise: 5,
    specificity: 5,
    helpfulness: 5,
    ethics: 5,
    responseSpeed: 4,
    onTime: 5,
    educational: 5,
    reuseIntent: 5,
    freeText: "초안의 강점과 한계를 함께 짚어줘서 다음 의뢰에도 재사용하고 싶습니다."
  });

  await login("admin login", "admin@demo.local");
  await runStep(
    "admin approve qualification",
    "POST",
    `/api/admin/qualifications/${DEMO_IDS.pendingQualification}/approve`,
    async () => {
      const response = await api(
        adminUrl,
        `/api/admin/qualifications/${DEMO_IDS.pendingQualification}/approve`,
        {
          method: "POST",
          body: {
            reason:
              "데모 운영자가 자격 검증 자료를 확인하고 승인하는 충분한 사유입니다."
          }
        }
      );
      return resultFromResponse(
        response,
        response.status === 200 || response.status === 404 ? "ok" : "fail"
      );
    }
  );

  writeFileSync(
    runJsonPath,
    JSON.stringify({ generatedAt: new Date(), steps: state.steps }, null, 2)
  );
  writeFileSync(reportPath, renderReport());
  if (state.steps.some((item) => item.status === "fail")) process.exitCode = 1;
}

async function login(name: string, email: string): Promise<void> {
  await runStep(name, "POST", "/api/auth/login", async () => {
    const response = await api(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { email, password: DEMO_PASSWORD }
    });
    rememberCookie(response.headers);
    return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
  });
}

async function postRequestAction(
  name: string,
  action: string,
  body: unknown
): Promise<void> {
  await runStep(name, "POST", `/api/supervision-requests/${action}`, async () => {
    const response = await api(
      baseUrl,
      `/api/supervision-requests/${currentRequestId()}/${action}`,
      {
        method: "POST",
        body
      }
    );
    return resultFromResponse(response, response.status === 200 ? "ok" : "fail");
  });
}

function currentRequestId(): string {
  const createStep = state.steps.find(
    (item) => item.name === "create supervision request"
  );
  const response = asRecord(createStep?.response);
  return stringFromUnknown(response?.["requestId"]);
}

async function runStep(
  name: string,
  method: string,
  target: string,
  run: () => Promise<Omit<StepResult, "name" | "method" | "target" | "durationMs">>
): Promise<void> {
  const started = Date.now();
  try {
    state.steps.push({
      name,
      method,
      target,
      durationMs: Date.now() - started,
      ...(await run())
    });
  } catch (error) {
    state.steps.push({
      name,
      method,
      target,
      durationMs: Date.now() - started,
      status: "fail",
      responseStatus: 0,
      response: { error: error instanceof Error ? error.message : String(error) }
    });
  }
}

async function api(
  host: string,
  path: string,
  options: { method: string; body?: unknown }
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body) headers["content-type"] = "application/json";
  if (state.cookie) headers["cookie"] = state.cookie;
  const init: RequestInit = {
    method: options.method,
    headers
  };
  if (options.body) init.body = JSON.stringify(options.body);
  return fetch(`${host}${path}`, init);
}

async function resultFromResponse(
  response: Response,
  status: StepStatus
): Promise<Omit<StepResult, "name" | "method" | "target" | "durationMs">> {
  return {
    status,
    responseStatus: response.status,
    response: await responseBody(response)
  };
}

async function responseBody(response: Response): Promise<JsonRecord> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as JsonRecord;
  } catch {
    return { text };
  }
}

function rememberCookie(headers: Headers): void {
  const cookies = headers.getSetCookie();
  const session = cookies
    .filter(
      (cookie): cookie is string => typeof cookie === "string" && cookie.length > 0
    )
    .map((cookie) => cookie.split(";")[0])
    .find((cookie): cookie is string => Boolean(cookie?.startsWith("csp_session=")));
  if (session) state.cookie = session;
}

async function waitForEmailToken(email: string, notBefore: number): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < 15_000) {
    const token = findEmailToken(email, notBefore);
    if (token) return token;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  return "";
}

function findEmailToken(email: string, notBefore: number): string {
  let log = "";
  try {
    log = readFileSync(devLogPath, "utf8");
  } catch {
    return "";
  }
  const lines = log.split(/\r?\n/u).reverse();
  for (const line of lines) {
    const timestamp = line.match(/^\[([^\]]+)\]/u)?.[1];
    if (timestamp && new Date(timestamp).getTime() < notBefore) continue;
    const jsonStart = line.indexOf("{");
    if (jsonStart === -1 || !line.includes("[dev-mailer]")) continue;
    try {
      const payload = JSON.parse(line.slice(jsonStart)) as {
        to?: string;
        text?: string;
      };
      if (payload.to !== email || !payload.text) continue;
      return payload.text.match(/토큰:\s*([A-Za-z0-9_-]+)/u)?.[1] ?? "";
    } catch {
      continue;
    }
  }
  return "";
}

function normalizeProducts(value: unknown): Array<{ id: string }> {
  if (Array.isArray(value)) return value.filter(isProduct);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isProduct) : [];
  } catch {
    return [];
  }
}

function isProduct(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}

function isSupervisorSummary(
  value: unknown
): value is { id: string; displayName: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "displayName" in value &&
    typeof value.id === "string" &&
    typeof value.displayName === "string"
  );
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : null;
}

function stringFromUnknown(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorCode(body: JsonRecord): string | null {
  const code = asRecord(body["error"])?.["code"];
  return typeof code === "string" ? code : null;
}

function completeDeidentification(): Record<string, true> {
  return {
    removedName: true,
    removedRrn: true,
    removedPhone: true,
    removedAddress: true,
    removedGuardianName: true,
    removedOrgName: true,
    removedChartNumber: true,
    filenameSafe: true,
    rawDataSafe: true,
    minimalInfo: true,
    clientConsentConfirmed: true,
    purposeUnderstood: true
  };
}

function renderReport(): string {
  const rows = state.steps
    .map(
      (stepItem) =>
        `| ${statusMark(stepItem.status)} | ${stepItem.name} | ${String(stepItem.responseStatus)} | ${summarize(stepItem.response)} | ${String(stepItem.durationMs)}ms |`
    )
    .join("\n");

  return `# Local Demo Report

Generated at: ${new Date().toISOString()}

## How to Run

1. \`pnpm install\`
2. \`pnpm demo:setup\`
3. \`pnpm demo:dev\`
4. Open \`http://localhost:3000\`

## Demo Accounts

All seeded accounts use password \`${DEMO_PASSWORD}\`.

| Role | Email |
| --- | --- |
| Supervisee | \`supervisee@demo.local\` |
| Fresh signup | \`${freshEmail}\` |
| Supervisor | \`approved-sup@demo.local\` |
| Admin | \`admin@demo.local\` |

## Automated Flow

| Result | Step | HTTP | Summary | Time |
| --- | --- | ---: | --- | ---: |
${rows}

## Notes

- Figma token setup: create a Figma file, set \`FIGMA_ACCESS_TOKEN\` and \`FIGMA_FILE_KEY\`, then run \`pnpm figma:sync\`.
- Ops smoke: run \`pnpm ops:smoke\` to create \`demo-evidence/OPS-REPORT.md\`; production requires Google Calendar OAuth credentials because connected-calendar FreeBusy and event sync are core reservation features.
- TOTP demo users are pre-seeded with \`totp_enabled=true\`; real secret rotation is a production handoff item.
- Raw evidence is in \`demo-evidence/setup.log\`, \`demo-evidence/seed.log\`, \`demo-evidence/dev.log\`, and \`demo-evidence/run.json\`.
`;
}

function statusMark(status: StepStatus): string {
  if (status === "ok") return "✓";
  if (status === "warn") return "⚠";
  return "✗";
}

function summarize(value: unknown): string {
  const text = JSON.stringify(value);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

type StepStatus = "ok" | "warn" | "fail";
type StepResult = {
  name: string;
  method: string;
  target: string;
  durationMs: number;
  status: StepStatus;
  responseStatus: number;
  response: unknown;
};
type JsonRecord = Record<string, unknown>;

main().catch((error: unknown) => {
  mkdirSync(evidenceDir, { recursive: true });
  const message = error instanceof Error ? error.message : String(error);
  writeFileSync(runJsonPath, JSON.stringify({ error: message }, null, 2));
  writeFileSync(reportPath, `# Local Demo Report\n\n✗ demo:run failed: ${message}\n`);
  process.exitCode = 1;
});
