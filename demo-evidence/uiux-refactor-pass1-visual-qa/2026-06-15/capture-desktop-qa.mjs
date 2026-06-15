import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = new URL("./", import.meta.url);
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const webBase = "http://localhost:3000";
const adminBase = "http://localhost:3001";
const password = "DemoPass!23";

const routeSets = [
  {
    role: "public",
    base: webBase,
    routes: ["/", "/supervisors", "/guide"]
  },
  {
    role: "supervisee",
    base: webBase,
    login: { email: "supervisee@demo.local", redirect: "/requests" },
    routes: ["/requests", "/requests/new", "/payments", "/case-archive", "/settings"]
  },
  {
    role: "supervisor",
    base: webBase,
    login: { email: "approved-sup@demo.local", redirect: "/supervisor" },
    routes: [
      "/supervisor",
      "/supervisor/requests",
      "/supervisor/profile",
      "/supervisor/products",
      "/supervisor/availability",
      "/supervisor/payouts"
    ]
  },
  {
    role: "admin",
    base: adminBase,
    adminLogin: true,
    routes: [
      "/admin",
      "/admin/queue",
      "/admin/qualifications",
      "/admin/refunds",
      "/admin/payouts",
      "/admin/audit"
    ]
  }
];

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true
});

const results = [];

try {
  for (const set of routeSets) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);

    if (set.login) {
      await loginWeb(page, set.login.email, set.login.redirect);
    }
    if (set.adminLogin) {
      await loginAdmin(page);
    }

    for (const route of set.routes) {
      const result = await captureRoute(page, set, route);
      results.push(result);
    }

    if (set.role === "supervisee") {
      const detail = await captureFirstRequestDetail(page);
      if (detail) results.push(detail);
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  new URL("desktop-qa-results.json", outDir),
  `${JSON.stringify(results, null, 2)}\n`
);

console.log(JSON.stringify({ count: results.length, outDir: outDir.pathname }, null, 2));

async function loginWeb(page, email, redirect) {
  await page.goto(`${webBase}/login?returnTo=${encodeURIComponent(redirect)}`, {
    waitUntil: "domcontentloaded"
  });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 }),
    page.getByRole("button", { name: "로그인" }).click()
  ]).catch(async () => {
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  });
}

async function loginAdmin(page) {
  const response = await page.request.post(`${webBase}/api/auth/login`, {
    data: {
      email: "admin@demo.local",
      password,
      returnTo: "/admin"
    }
  });
  const body = await response.json();
  const handoff = body?.data?.adminHandoffUrl;
  if (!handoff) throw new Error("Admin handoff URL was not returned.");
  const localHandoff = new URL(handoff);
  localHandoff.protocol = "http:";
  localHandoff.host = "localhost:3001";
  await page.goto(localHandoff.toString(), { waitUntil: "domcontentloaded" });
  await page.waitForURL((url) => url.origin === adminBase && url.pathname.startsWith("/admin"), {
    timeout: 20_000
  });
}

async function captureRoute(page, set, route) {
  const url = `${set.base}${route}`;
  const startedAt = Date.now();
  let error = "";
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  const safeName = `${set.role}-${routeToFile(route)}.png`;
  const screenshotPath = path.join(outDir.pathname, safeName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const metrics = await page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    const h1 = Array.from(document.querySelectorAll("h1")).map((node) =>
      (node.textContent ?? "").trim()
    );
    const navs = Array.from(document.querySelectorAll("nav")).map((nav) =>
      (nav.textContent ?? "").replace(/\s+/g, " ").trim()
    );
    const activeNav = Array.from(document.querySelectorAll('[aria-current="page"]')).map(
      (node) => (node.textContent ?? "").replace(/\s+/g, " ").trim()
    );
    const buttons = Array.from(
      document.querySelectorAll('button, a[href], input[type="submit"]')
    )
      .map((node) => (node.textContent ?? node.getAttribute("value") ?? "").trim())
      .filter(Boolean);
    return {
      activeNav,
      buttons: buttons.slice(0, 30),
      cardLikeCount: document.querySelectorAll(
        '.rounded-\\[24px\\], .rounded-\\[28px\\], .rounded-\\[32px\\], .rounded-3xl, [class*="card"], article'
      ).length,
      errorLike: /오류|에러|문제가 발생|500|404|403|권한|찾을 수 없습니다/.test(text),
      gridLikeCount: document.querySelectorAll('[class*="grid-cols"], [class*="grid "]')
        .length,
      h1,
      navs,
      title: document.title
    };
  });

  return {
    route,
    role: set.role,
    url,
    finalUrl: page.url(),
    screenshotPath,
    status: error ? "capture-partial" : "captured",
    error,
    elapsedMs: Date.now() - startedAt,
    ...metrics
  };
}

async function captureFirstRequestDetail(page) {
  await page.goto(`${webBase}/requests`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  const href = await page
    .locator('a[href^="/requests/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")).find(Boolean))
    .catch(() => null);
  if (!href || href === "/requests/new") return null;
  return captureRoute(page, { role: "supervisee", base: webBase }, href);
}

function routeToFile(route) {
  const cleaned = route.replace(/^\/+/, "").replace(/\/+$/, "") || "home";
  return cleaned.replace(/[^a-zA-Z0-9가-힣_-]+/g, "-");
}
