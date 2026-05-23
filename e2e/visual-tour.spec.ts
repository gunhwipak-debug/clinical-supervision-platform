import { mkdir } from "node:fs/promises";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const WEB = "http://localhost:3000";
const ADMIN = "http://localhost:3001";
const PASSWORD = "DemoPass!23";

const ids = {
  supervisorProfile: "10000000-0000-4000-8000-000000000101",
  product: "10000000-0000-4000-8000-000000000301",
  superviseeRequest: "10000000-0000-4000-8000-000000000608",
  supervisorRequest: "10000000-0000-4000-8000-000000000602",
  payment: "10000000-0000-4000-8000-000000000701"
};

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 }
] as const;

const publicPages = [
  { name: "home", url: `${WEB}/` },
  { name: "login", url: `${WEB}/login` },
  { name: "signup", url: `${WEB}/signup` },
  { name: "verify-email", url: `${WEB}/verify-email` },
  { name: "forgot-password", url: `${WEB}/forgot-password` },
  { name: "reset-password", url: `${WEB}/reset-password` },
  { name: "supervisors", url: `${WEB}/supervisors` },
  { name: "supervisor-detail", url: `${WEB}/supervisors/${ids.supervisorProfile}` },
  { name: "request-new", url: `${WEB}/requests/new?serviceProductId=${ids.product}` }
] as const;

const superviseePages = [
  { name: "requests", url: `${WEB}/requests` },
  { name: "request-detail", url: `${WEB}/requests/${ids.superviseeRequest}` },
  { name: "payments", url: `${WEB}/payments` },
  { name: "payment-detail", url: `${WEB}/payments/${ids.payment}` },
  { name: "settings", url: `${WEB}/settings` }
] as const;

const supervisorPages = [
  { name: "supervisor-dashboard", url: `${WEB}/supervisor` },
  { name: "supervisor-requests", url: `${WEB}/supervisor/requests` },
  {
    name: "supervisor-request-detail",
    url: `${WEB}/supervisor/requests/${ids.supervisorRequest}`
  },
  { name: "supervisor-profile", url: `${WEB}/supervisor/profile` },
  { name: "supervisor-qualifications", url: `${WEB}/supervisor/qualifications` },
  { name: "supervisor-products", url: `${WEB}/supervisor/products` },
  { name: "supervisor-availability", url: `${WEB}/supervisor/availability` }
] as const;

const adminPages = [
  { name: "admin-dashboard", url: `${ADMIN}/admin` },
  { name: "admin-qualifications", url: `${ADMIN}/admin/qualifications` },
  { name: "admin-refunds", url: `${ADMIN}/admin/refunds` },
  { name: "admin-payouts", url: `${ADMIN}/admin/payouts` }
] as const;

test.describe("visual tour", () => {
  for (const viewport of viewports) {
    test(`captures critical pages at ${viewport.name}`, async ({ page, context }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await mkdir("demo-evidence/screenshots", { recursive: true });

      for (const entry of publicPages) {
        await capture(page, viewport.name, entry.name, entry.url);
      }

      await login(context, "supervisee@demo.local");
      for (const entry of superviseePages) {
        await capture(page, viewport.name, entry.name, entry.url);
      }

      await context.clearCookies();
      await login(context, "approved-sup@demo.local");
      for (const entry of supervisorPages) {
        await capture(page, viewport.name, entry.name, entry.url);
      }

      await context.clearCookies();
      await login(context, "admin@demo.local");
      for (const entry of adminPages) {
        await capture(page, viewport.name, entry.name, entry.url);
      }
    });
  }
});

async function login(context: BrowserContext, email: string) {
  const response = await context.request.post(`${WEB}/api/auth/login`, {
    data: { email, password: PASSWORD }
  });
  expect(response.status(), `${email} login`).toBe(200);
  const header = response.headers()["set-cookie"];
  expect(header, `${email} set-cookie`).toBeTruthy();
  if (!header) throw new Error(`${email} login did not set a cookie`);
  const [pair] = header.split(";");
  if (!pair) throw new Error(`${email} login cookie was empty`);
  const [name, value] = pair.split("=");
  if (!name || !value) throw new Error(`${email} login cookie was malformed`);
  await context.addCookies([
    {
      name,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }
  ]);
}

async function capture(page: Page, viewport: string, name: string, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-dev-overlay] {
        display: none !important;
      }
    `
  });
  await page.screenshot({
    path: `demo-evidence/screenshots/${viewport}-${name}.png`,
    fullPage: true
  });
}
