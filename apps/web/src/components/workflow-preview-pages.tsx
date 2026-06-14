import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type SectionId =
  | "home"
  | "supervisors"
  | "login"
  | "guide"
  | "request-new"
  | "material-upload"
  | "request-detail"
  | "payments"
  | "waiting"
  | "case-archive"
  | "supervisor-dashboard"
  | "supervisor-workspace"
  | "admin-qualifications"
  | "admin";

const sourceCandidates = [
  join(process.cwd(), "src/design-sources/clinicflow-tech-preview.html"),
  join(process.cwd(), "apps/web/src/design-sources/clinicflow-tech-preview.html"),
  join(process.cwd(), "demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html"),
  join(process.cwd(), "../demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html"),
  join(process.cwd(), "../../demo-evidence/rebuild-tech-ui/clinicflow-tech-preview.html")
];

const anchorRoutes: Record<string, string> = {
  home: "/",
  supervisors: "/supervisors",
  login: "/login",
  guide: "/guide",
  "request-new": "/requests/new",
  "material-upload": "/requests/new#material-upload",
  payments: "/payments",
  waiting: "/payments/demo-receipt",
  "request-detail": "/requests/demo-additional-info",
  "case-archive": "/case-archive",
  "supervisor-dashboard": "/supervisor",
  "supervisor-workspace": "/supervisor/requests/demo-review",
  "admin-qualifications": "/supervisor/qualifications",
  admin: "/supervisor/requests"
};

const sourceHtml = readPreviewSource();
const previewStyle = extractFirst(sourceHtml, /<style>([\s\S]*?)<\/style>/, "");
const previewHeader = rewriteAnchors(
  extractFirst(sourceHtml, /(<header[\s\S]*?<\/header>)/, "")
);

export function PreviewNotice() {
  return null;
}

export function DemoRequestsPreview() {
  return <StaticTechPreview sections={["login"]} />;
}

export function DemoNewRequestPreview() {
  return <StaticTechPreview sections={["request-new", "material-upload"]} />;
}

export function DemoRequestDetailPreview() {
  return <StaticTechPreview sections={["request-detail"]} />;
}

export function DemoPaymentsPreview() {
  return <StaticTechPreview sections={["payments"]} />;
}

export function DemoPaymentDetailPreview() {
  return <StaticTechPreview sections={["waiting"]} />;
}

export function DemoCaseArchivePreview() {
  return <StaticTechPreview sections={["case-archive"]} />;
}

export function DemoSettingsPreview() {
  return <StaticTechPreview sections={["login", "guide"]} />;
}

export function DemoNotificationsPreview() {
  return <StaticTechPreview sections={["request-detail", "waiting"]} />;
}

export function DemoSupervisorHomePreview() {
  return <StaticTechPreview sections={["supervisor-dashboard"]} />;
}

export function DemoSupervisorRequestsPreview() {
  return <StaticTechPreview sections={["supervisor-dashboard"]} />;
}

export function DemoSupervisorRequestDetailPreview() {
  return <StaticTechPreview sections={["supervisor-workspace"]} />;
}

export function DemoSupervisorProfilePreview() {
  return <StaticTechPreview sections={["supervisors"]} />;
}

export function DemoSupervisorAvailabilityPreview() {
  return <StaticTechPreview sections={["request-new"]} />;
}

export function DemoSupervisorProductsPreview() {
  return <StaticTechPreview sections={["request-new", "payments"]} />;
}

export function DemoSupervisorMemoryPreview() {
  return <StaticTechPreview sections={["case-archive"]} />;
}

export function DemoSupervisorPayoutsPreview() {
  return <StaticTechPreview sections={["payments", "admin"]} />;
}

export function DemoSupervisorQualificationsPreview() {
  return <StaticTechPreview sections={["admin-qualifications"]} />;
}

function StaticTechPreview({ sections }: { sections: SectionId[] }) {
  const body = sections.map((section) => extractSection(section)).join("\n");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: previewStyle }} />
      <div
        dangerouslySetInnerHTML={{
          __html: `${previewHeader}<main>${rewriteAnchors(body)}</main>`
        }}
      />
    </>
  );
}

function readPreviewSource() {
  const sourcePath = sourceCandidates.find((candidate) => existsSync(candidate));
  if (!sourcePath) {
    throw new Error("ClinicFlow tech preview source was not found.");
  }
  return readFileSync(sourcePath, "utf8");
}

function extractSection(id: SectionId) {
  const pattern = new RegExp(
    `<section([^>]*?)id=["']${id}["']([^>]*)>[\\s\\S]*?(?=<section[^>]+id=|</main>|</body>)`,
    "i"
  );
  const section = sourceHtml.match(pattern)?.[0];
  if (!section) {
    throw new Error(`ClinicFlow tech preview section not found: ${id}`);
  }
  return section;
}

function extractFirst(source: string, pattern: RegExp, fallback: string) {
  return source.match(pattern)?.[1] ?? fallback;
}

function rewriteAnchors(markup: string) {
  return markup.replace(/href="#([^"]+)"/g, (_, id: string) => {
    const route = anchorRoutes[id];
    return route ? `href="${route}"` : `href="#${id}"`;
  });
}
