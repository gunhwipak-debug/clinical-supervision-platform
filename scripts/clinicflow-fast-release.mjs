#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const command = args[0] || "help";
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
const evidenceDir = join(".omo", "evidence", "fast-release", timestamp);
const latestPath = join(".omo", "evidence", "fast-release", "LATEST.md");
const vercelProjectPath = join(".vercel", "project.json");
let restoreVercelProjectLink = null;
const projects = {
  web: {
    buildCommand: "pnpm --filter @csp/web build",
    outputDirectory: "apps/web/.next",
    packageFilter: "@csp/web",
    projectId: "prj_PRtoExoWznCEbmA9bdQVmrBbX9iS",
    projectName: "clinicflow-web",
    teamId: "team_ORdMo2OL3e6nonZv8j4y63GG",
    stableUrl: "https://clinicflow-web-beta.vercel.app"
  },
  admin: {
    buildCommand: "pnpm --filter @csp/admin build",
    outputDirectory: "apps/admin/.next",
    packageFilter: "@csp/admin",
    projectId: "prj_ZPJaelyzzY0uLMIT8ea8jya2qVsP",
    projectName: "clinicflow-admin",
    teamId: "team_ORdMo2OL3e6nonZv8j4y63GG",
    stableUrl: "https://clinicflow-admin-six.vercel.app"
  }
};

const supportedPrettierFiles = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml"
]);

const generatedEvidencePrefixes = ["demo-evidence/route-alignment-qa/"];

function restoreVercelProjectLinkNow() {
  if (!restoreVercelProjectLink) return;
  const restore = restoreVercelProjectLink;
  restoreVercelProjectLink = null;
  restore();
}

function handleReleaseSignal(signal) {
  restoreVercelProjectLinkNow();
  process.exit(signal === "SIGINT" ? 130 : 143);
}

process.once("SIGINT", () => handleReleaseSignal("SIGINT"));
process.once("SIGTERM", () => handleReleaseSignal("SIGTERM"));

function usage() {
  console.log(`ClinicFlow fast release

Usage:
  pnpm release:web:fast-check
  pnpm release:web:ui-check
  pnpm release:web:preview
  pnpm release:web:ui-preview
  pnpm release:web:prod
  pnpm release:web:ui-prod
  pnpm release:admin:check
  pnpm release:admin:preview
  pnpm release:admin:prod

Notes:
  - release:web:* targets the clinicflow-web Vercel project.
  - release:admin:* targets the clinicflow-admin Vercel project.
  - Vercel prints a unique immutable deployment URL on every deploy.
    The stable user-facing URLs are:
      web:   ${projects.web.stableUrl}
      admin: ${projects.admin.stableUrl}
  - fast-check runs cheap local checks for the selected app by default.
  - ui-check/ui-preview/ui-prod skip local TypeScript when UI was already checked in
    Codex/browser evidence and Vercel cloud build is the parity gate.
  - Set FULL_BUILD=1 to add pnpm --filter <app> build locally.
  - preview/prod run fast-check first, then Vercel deploy and HTTP smoke checks.
`);
}

function ensureEvidenceDir() {
  mkdirSync(evidenceDir, { recursive: true });
}

function runStep(label, cmd, cmdArgs, options = {}) {
  const timeout = options.timeoutMs ?? 120_000;
  console.log(`→ ${label}`);
  const result = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout,
    env: process.env
  });
  const output = [
    `$ ${[cmd, ...cmdArgs].join(" ")}`,
    result.stdout || "",
    result.stderr || ""
  ].join("\n");

  if (options.logFile) {
    ensureEvidenceDir();
    writeFileSync(join(evidenceDir, options.logFile), output);
  }

  if (result.error) {
    throw new Error(`${label} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit ${result.status}\n${output}`);
  }

  console.log(`✓ ${label}`);
  return output;
}

function runStepLive(label, cmd, cmdArgs, options = {}) {
  const timeout = options.timeoutMs ?? 120_000;
  const heartbeatMs = options.heartbeatMs ?? 30_000;
  console.log(`→ ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let lastOutputAt = Date.now();
    const startedAt = Date.now();

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`${label} failed: timed out after ${timeout}ms`));
    }, timeout);
    const heartbeat = setInterval(() => {
      if (settled) return;
      if (Date.now() - lastOutputAt < heartbeatMs) return;
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      lastOutputAt = Date.now();
      process.stdout.write(`\n… ${label} still running after ${elapsed}s\n`);
    }, heartbeatMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      lastOutputAt = Date.now();
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      lastOutputAt = Date.now();
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      reject(new Error(`${label} failed: ${error.message}`));
    });

    child.on("close", (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      const output = [
        `$ ${[cmd, ...cmdArgs].join(" ")}`,
        stdout || "",
        stderr || ""
      ].join("\n");

      if (options.logFile) {
        ensureEvidenceDir();
        writeFileSync(join(evidenceDir, options.logFile), output);
      }

      if (status !== 0) {
        reject(new Error(`${label} failed with exit ${status}\n${output}`));
        return;
      }

      console.log(`✓ ${label}`);
      resolve(output);
    });
  });
}

function changedFiles(app) {
  if (process.env.FAST_RELEASE_CHANGED_FILES) {
    return process.env.FAST_RELEASE_CHANGED_FILES.split(/[,\n]/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (process.env.FAST_RELEASE_USE_GIT !== "1") {
    return [];
  }

  const trackedOutput = runStep(
    "tracked changed-file list",
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"],
    {
      timeoutMs: 15_000
    }
  );

  return trackedOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("$ "))
    .filter((file) => {
      if (app === "web") return !file.startsWith("apps/admin/");
      if (app === "admin") return !file.startsWith("apps/web/");
      return true;
    });
}

function prettierCandidates(files) {
  return files.filter((file) => {
    if (generatedEvidencePrefixes.some((prefix) => file.startsWith(prefix))) {
      return false;
    }
    const dot = file.lastIndexOf(".");
    return dot > -1 && supportedPrettierFiles.has(file.slice(dot));
  });
}

function assertPreviewSourcesSynced() {
  const appSource = "apps/web/src/design-sources/clinicflow-tech-preview.html";
  const demoSource = "demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html";
  if (!existsSync(appSource) || !existsSync(demoSource)) {
    return "skipped: preview source pair is not present";
  }

  const appHtml = readFileSync(appSource, "utf8");
  const demoHtml = readFileSync(demoSource, "utf8");
  if (appHtml !== demoHtml) {
    throw new Error(
      `preview source drift: ${appSource} and ${demoSource} differ. Sync them before release.`
    );
  }
  return "passed: approved preview source is synced";
}

function cleanTypeScriptBuildInfo() {
  const roots = ["apps/web", "apps/admin"];
  let removed = 0;

  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const file of readdirSync(root)) {
      if (!file.startsWith("tsconfig") || !file.endsWith(".tsbuildinfo")) {
        continue;
      }
      rmSync(join(root, file), { force: true });
      removed += 1;
    }
  }

  return `removed ${removed} ignored TypeScript build-info file(s)`;
}

function detectVercelCommand() {
  const localVercel = spawnSync("pnpm", ["exec", "vercel", "--version"], {
    encoding: "utf8"
  });
  if (localVercel.status === 0) {
    return ["pnpm", ["exec", "vercel"]];
  }
  return ["pnpm", ["dlx", "vercel@54.13.0"]];
}

function parseVercelAppUrl(output) {
  const urls = [...output.matchAll(/https:\/\/[^\s]+\.vercel\.app[^\s]*/g)].map(
    (match) => match[0].replace(/[),".]+$/, "")
  );
  return urls.find((url) => !url.includes("vercel.com/")) || urls[0] || null;
}

function smokeUrl(url, label) {
  const curl = existsSync("/usr/bin/curl") ? "/usr/bin/curl" : "curl";
  return runStep(`${label} smoke`, curl, ["-I", "-L", "--max-time", "45", url], {
    timeoutMs: 60_000,
    logFile: `${label}-smoke.log`
  });
}

function writeSummary(lines) {
  ensureEvidenceDir();
  const summary = [
    "# ClinicFlow Fast Release Evidence",
    "",
    `- Timestamp: ${timestamp}`,
    ...lines.map((line) => `- ${line}`),
    ""
  ].join("\n");
  writeFileSync(join(evidenceDir, "summary.md"), summary);
  mkdirSync(dirname(latestPath), { recursive: true });
  writeFileSync(latestPath, summary);
  console.log(summary);
}

function projectLink(project) {
  return {
    projectId: project.projectId,
    orgId: project.teamId,
    projectName: project.projectName,
    settings: {
      createdAt: null,
      framework: "nextjs",
      devCommand: null,
      installCommand: "pnpm install --frozen-lockfile",
      buildCommand: project.buildCommand,
      outputDirectory: project.outputDirectory,
      rootDirectory: null,
      directoryListing: false,
      nodeVersion: "24.x"
    }
  };
}

async function withTemporaryProjectLink(project, callback) {
  const prior = existsSync(vercelProjectPath)
    ? readFileSync(vercelProjectPath, "utf8")
    : null;
  mkdirSync(dirname(vercelProjectPath), { recursive: true });

  restoreVercelProjectLink = () => {
    if (prior === null) {
      rmSync(vercelProjectPath, { force: true });
    } else {
      writeFileSync(vercelProjectPath, prior);
    }
  };

  writeFileSync(
    vercelProjectPath,
    `${JSON.stringify(projectLink(project), null, 2)}\n`
  );

  try {
    return await callback();
  } finally {
    restoreVercelProjectLinkNow();
  }
}

function selectedProject(app) {
  const project = projects[app];
  if (!project) {
    throw new Error(
      `Unknown app "${app}". Expected one of: ${Object.keys(projects).join(", ")}`
    );
  }
  return project;
}

function fastCheck(app = "web") {
  const project = selectedProject(app);
  const files = changedFiles(app);
  const prettierFiles = prettierCandidates(files);
  const checks = [];

  if (process.env.FAST_RELEASE_USE_GIT === "1") {
    runStep("git diff whitespace check", "git", ["diff", "--check"], {
      timeoutMs: 15_000,
      logFile: "git-diff-check.log"
    });
    checks.push("git diff --check passed");
  } else {
    checks.push(
      "git diff checks skipped by default for speed; set FAST_RELEASE_USE_GIT=1 to opt in"
    );
  }

  if (process.env.FAST_RELEASE_RUN_ORIGIN14_GUARD === "1") {
    runStep(
      "Origin-14 guard",
      "node",
      [
        "scripts/clinicflow-origin14-guard.mjs",
        "--evidence",
        join(evidenceDir, "origin14-guard.json")
      ],
      { timeoutMs: 180_000, logFile: "origin14-guard.log" }
    );
    checks.push("Origin-14 guard passed");
  } else {
    checks.push(
      "Origin-14 guard skipped by default for release speed; set FAST_RELEASE_RUN_ORIGIN14_GUARD=1 for design-regression audit"
    );
  }

  checks.push(cleanTypeScriptBuildInfo());

  if (prettierFiles.length > 0) {
    runStep(
      "prettier changed files check",
      "pnpm",
      ["exec", "prettier", "--check", ...prettierFiles],
      { timeoutMs: 180_000, logFile: "prettier-check.log" }
    );
    checks.push(`prettier passed for ${prettierFiles.length} changed file(s)`);
  } else {
    checks.push(
      "prettier skipped: no changed supported files supplied; set FAST_RELEASE_CHANGED_FILES or FAST_RELEASE_USE_GIT=1"
    );
  }

  checks.push(assertPreviewSourcesSynced());

  if (process.env.FAST_RELEASE_SKIP_TYPECHECK === "1") {
    checks.push(
      "local TypeScript skipped: FAST_RELEASE_SKIP_TYPECHECK=1; Vercel cloud build remains the release parity gate"
    );
  } else {
    runStep(
      `${app} typecheck without incremental cache`,
      "pnpm",
      [
        "--filter",
        project.packageFilter,
        "exec",
        "tsc",
        "--noEmit",
        "--incremental",
        "false",
        "--pretty",
        "false"
      ],
      { timeoutMs: 120_000, logFile: `${app}-typecheck-noincremental.log` }
    );
    checks.push(`${app} typecheck passed without incremental cache`);
  }

  if (process.env.FULL_BUILD === "1") {
    runStep(
      `local ${app} build`,
      "pnpm",
      ["--filter", project.packageFilter, "build"],
      {
        timeoutMs: 900_000,
        logFile: `${app}-build.log`
      }
    );
    checks.push(`local pnpm --filter ${project.packageFilter} build passed`);
  } else {
    checks.push(`local ${app} build skipped: set FULL_BUILD=1 for full local parity`);
  }

  writeSummary(checks);
}

async function deploy(target, app = "web") {
  const project = selectedProject(app);
  fastCheck(app);

  const [vercelCmd, baseArgs] = detectVercelCommand();
  const deployArgs = [...baseArgs, "deploy", "--yes", "--meta", `clinicflowApp=${app}`];
  if (target === "prod") {
    deployArgs.push("--prod");
  }

  const output = await withTemporaryProjectLink(project, () =>
    runStepLive(`Vercel ${app} ${target} deploy`, vercelCmd, deployArgs, {
      timeoutMs: Number(process.env.VERCEL_DEPLOY_TIMEOUT_MS || 900_000),
      heartbeatMs: Number(process.env.VERCEL_DEPLOY_HEARTBEAT_MS || 30_000),
      logFile: `vercel-${app}-${target}.log`
    })
  );
  const deployedUrl = parseVercelAppUrl(output);
  if (!deployedUrl) {
    throw new Error(
      "Vercel deploy finished, but no vercel.app URL was found in output."
    );
  }

  smokeUrl(deployedUrl, `vercel-${app}-${target}`);
  const lines = [
    `Vercel project: ${project.projectName}`,
    `Immutable deployment URL: ${deployedUrl}`,
    `Stable URL: ${project.stableUrl}`
  ];

  if (target === "prod") {
    smokeUrl(project.stableUrl, `${app}-stable-url`);
    lines.push(`Production alias smoke passed: ${project.stableUrl}`);
  }

  writeSummary(lines);
}

async function main() {
  if (command === "help" || command === "--help" || command === "-h") {
    usage();
  } else if (command === "check") {
    fastCheck("web");
  } else if (command === "ui-check") {
    process.env.FAST_RELEASE_SKIP_TYPECHECK = "1";
    fastCheck("web");
  } else if (command === "admin-check") {
    process.env.FAST_RELEASE_SKIP_TYPECHECK = "1";
    fastCheck("admin");
  } else if (command === "preview") {
    await deploy("preview", "web");
  } else if (command === "ui-preview") {
    process.env.FAST_RELEASE_SKIP_TYPECHECK = "1";
    await deploy("preview", "web");
  } else if (command === "prod") {
    await deploy("prod", "web");
  } else if (command === "ui-prod") {
    process.env.FAST_RELEASE_SKIP_TYPECHECK = "1";
    await deploy("prod", "web");
  } else if (command === "admin-preview") {
    process.env.FAST_RELEASE_SKIP_TYPECHECK = "1";
    await deploy("preview", "admin");
  } else if (command === "admin-prod") {
    process.env.FAST_RELEASE_SKIP_TYPECHECK = "1";
    await deploy("prod", "admin");
  } else {
    usage();
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
