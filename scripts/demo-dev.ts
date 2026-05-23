import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const seedDataDir = join(root, "dev-data/pglite");
const runtimeDataDir = join(root, "dev-data/runtime", String(process.pid));
const webDataDir = join(runtimeDataDir, "web");
const adminDataDir = join(runtimeDataDir, "admin");
const storageDir = join(root, "dev-data/storage");
const logPath = join(evidenceDir, "dev.log");

const baseEnv = {
  ...process.env,
  NODE_ENV: "development",
  DEV_DB: "pglite",
  DATABASE_URL: "pglite://runtime",
  SERVICE_DATABASE_URL: "pglite://service",
  BETTER_AUTH_SECRET:
    process.env["BETTER_AUTH_SECRET"] ?? "demo-better-auth-secret-at-least-32-chars",
  PHI_ENCRYPTION_KEY:
    process.env["PHI_ENCRYPTION_KEY"] ?? "demo-phi-encryption-secret-at-least-32",
  NEXT_PUBLIC_WEB_URL: "http://localhost:3000",
  NEXT_PUBLIC_ADMIN_URL: "http://localhost:3001",
  TOSS_MODE: "dev",
  TOSS_CLIENT_KEY: process.env["TOSS_CLIENT_KEY"] ?? "demo-client-key",
  TOSS_SECRET_KEY: process.env["TOSS_SECRET_KEY"] ?? "demo-secret-key",
  TOSS_WEBHOOK_SECRET:
    process.env["TOSS_WEBHOOK_SECRET"] ?? "demo-webhook-secret-at-least-32-chars",
  LOCAL_STORAGE_DIR: storageDir,
  LOCAL_STORAGE_SECRET:
    process.env["LOCAL_STORAGE_SECRET"] ?? "demo-local-storage-secret-at-least-32"
};

async function main() {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(logPath, "");
  log(`Demo dev started at ${new Date().toISOString()}`);
  log(`DEV_DB_SEED_PATH=${seedDataDir}`);
  prepareRuntimeDataDir("web", webDataDir);
  prepareRuntimeDataDir("admin", adminDataDir);

  const web = start("web", ["--filter", "@csp/web", "dev"], webDataDir);
  const admin = start("admin", ["--filter", "@csp/admin", "dev"], adminDataDir);

  const shutdown = () => {
    log("Stopping demo dev servers");
    web.kill("SIGTERM");
    admin.kill("SIGTERM");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  web.on("exit", (code) => {
    log(`web exited with ${String(code)}`);
    admin.kill("SIGTERM");
    process.exitCode = code ?? 1;
  });
  admin.on("exit", (code) => {
    log(`admin exited with ${String(code)}`);
    web.kill("SIGTERM");
    process.exitCode = code ?? 1;
  });

  await waitForHttp("http://localhost:3000/");
  await waitForHttp("http://localhost:3000/supervisors");
  await waitForHttp("http://localhost:3001/");
  log("Health check passed: web /, web /supervisors, admin /");
  log("Open http://localhost:3000");
}

function start(label: string, args: string[], dataDir: string): ChildProcess {
  log(`Starting ${label}: pnpm ${args.join(" ")}`);
  const child = spawn("pnpm", args, {
    cwd: root,
    env: { ...baseEnv, DEV_DB_PATH: dataDir },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk: Buffer) => writeChunk(label, chunk));
  child.stderr.on("data", (chunk: Buffer) => writeChunk(label, chunk));

  return child;
}

function prepareRuntimeDataDir(label: string, target: string): void {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(runtimeDataDir, { recursive: true });
  cpSync(seedDataDir, target, { recursive: true });
  log(`${label} DEV_DB_PATH=${target}`);
}

async function waitForHttp(url: string): Promise<void> {
  const started = Date.now();
  let lastError = "";

  while (Date.now() - started < 60_000) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        log(`health ${url} -> 200`);
        return;
      }
      lastError = `status ${String(response.status)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

function writeChunk(label: string, chunk: Buffer): void {
  for (const line of chunk.toString("utf8").split(/\r?\n/u)) {
    if (line.length > 0) log(`${label} ${line}`);
  }
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  writeFileSync(logPath, `${line}\n`, { flag: "a" });
}

main().catch((error: unknown) => {
  log(`demo dev failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
