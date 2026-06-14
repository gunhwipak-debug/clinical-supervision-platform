#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const command = args[0] || "help";
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
const evidenceDir = join(".omo", "evidence", "fast-release", timestamp);
const latestPath = join(".omo", "evidence", "fast-release", "LATEST.md");
const rootUrl = "https://clinicflow-web-beta.vercel.app";

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

function usage() {
  console.log(`ClinicFlow fast release

Usage:
  pnpm release:web:fast-check
  pnpm release:web:preview
  pnpm release:web:prod

Notes:
  - fast-check runs only cheap local checks by default.
  - Set FULL_BUILD=1 to add pnpm --filter @csp/web build locally.
  - preview/prod run fast-check first, then Vercel deploy and HTTP smoke checks.
`);
}

function ensureEvidenceDir() {
  mkdirSync(evidenceDir, { recursive: true });
}

function runStep(label, cmd, cmdArgs, options = {}) {
  const timeout = options.timeoutMs ?? 120_000;
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

  return output;
}

function changedFiles() {
  const trackedOutput = runStep("tracked changed-file list", "git", [
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    "HEAD"
  ]);
  const untrackedOutput = runStep("untracked file list", "git", [
    "ls-files",
    "--others",
    "--exclude-standard"
  ]);
  return [...trackedOutput.split("\n"), ...untrackedOutput.split("\n")]
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("$ "));
}

function prettierCandidates(files) {
  return files.filter((file) => {
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

function detectVercelCommand() {
  const globalVercel = spawnSync("sh", ["-lc", "command -v vercel"], {
    encoding: "utf8"
  });
  if (globalVercel.status === 0 && globalVercel.stdout.trim()) {
    return [globalVercel.stdout.trim(), []];
  }
  return ["pnpm", ["dlx", "vercel@latest"]];
}

function parseVercelAppUrl(output) {
  const urls = [...output.matchAll(/https:\/\/[^\s]+\.vercel\.app[^\s]*/g)].map(
    (match) => match[0].replace(/[),]+$/, "")
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

function fastCheck() {
  const files = changedFiles();
  const prettierFiles = prettierCandidates(files);
  const checks = [];

  runStep("git diff whitespace check", "git", ["diff", "--check"], {
    logFile: "git-diff-check.log"
  });
  checks.push("git diff --check passed");

  if (prettierFiles.length > 0) {
    runStep(
      "prettier changed files check",
      "pnpm",
      ["exec", "prettier", "--check", ...prettierFiles],
      { timeoutMs: 180_000, logFile: "prettier-check.log" }
    );
    checks.push(`prettier passed for ${prettierFiles.length} changed file(s)`);
  } else {
    checks.push("prettier skipped: no changed supported files");
  }

  checks.push(assertPreviewSourcesSynced());

  if (process.env.FULL_BUILD === "1") {
    runStep("local web build", "pnpm", ["--filter", "@csp/web", "build"], {
      timeoutMs: 900_000,
      logFile: "web-build.log"
    });
    checks.push("local pnpm --filter @csp/web build passed");
  } else {
    checks.push("local web build skipped: set FULL_BUILD=1 for full local parity");
  }

  writeSummary(checks);
}

function deploy(target) {
  fastCheck();

  const [vercelCmd, baseArgs] = detectVercelCommand();
  const deployArgs = [...baseArgs, "deploy", "--yes"];
  if (target === "prod") {
    deployArgs.push("--prod");
  }

  const output = runStep(`Vercel ${target} deploy`, vercelCmd, deployArgs, {
    timeoutMs: Number(process.env.VERCEL_DEPLOY_TIMEOUT_MS || 1_800_000),
    logFile: `vercel-${target}.log`
  });
  const deployedUrl = parseVercelAppUrl(output);
  if (!deployedUrl) {
    throw new Error(
      "Vercel deploy finished, but no vercel.app URL was found in output."
    );
  }

  smokeUrl(deployedUrl, `vercel-${target}`);
  const lines = [`Vercel ${target} deployment URL: ${deployedUrl}`];

  if (target === "prod") {
    smokeUrl(rootUrl, "clinicflow-web-beta");
    lines.push(`Production alias smoke passed: ${rootUrl}`);
  }

  writeSummary(lines);
}

try {
  if (command === "help" || command === "--help" || command === "-h") {
    usage();
  } else if (command === "check") {
    fastCheck();
  } else if (command === "preview") {
    deploy("preview");
  } else if (command === "prod") {
    deploy("prod");
  } else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
