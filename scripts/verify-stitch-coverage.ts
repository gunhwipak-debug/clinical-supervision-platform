import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const stitchRoot = join(root, "designs/stitch/stitch_clinical_trust_auth_redesign");
const cssRoot = join(root, "apps/web/.next/static/css");
const noBuild = process.argv.includes("--no-build");

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(file, predicate));
    } else if (predicate(file)) {
      files.push(file);
    }
  }
  return files;
}

function extractClasses(html: string): string[] {
  const classes = new Set<string>();
  for (const match of html.matchAll(/class=["']([^"']+)["']/g)) {
    const classList = match[1] ?? "";
    for (const token of classList.trim().split(/\s+/)) {
      if (token.length > 0) {
        classes.add(token);
      }
    }
  }
  return [...classes].sort();
}

function escapeClassName(className: string): string {
  return className.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

function runBuild(): void {
  if (noBuild) {
    return;
  }

  const result = spawnSync("pnpm", ["--filter", "@csp/web", "build"], {
    cwd: root,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error("web build failed before Stitch coverage verification");
  }
}

function main(): void {
  const htmlFiles = walkFiles(stitchRoot, (file) => file.endsWith("code.html"));
  if (htmlFiles.length === 0) {
    throw new Error(`No Stitch code.html files found under ${stitchRoot}`);
  }

  const expectedClasses = new Set<string>();
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const className of extractClasses(html)) {
      expectedClasses.add(className);
    }
  }

  runBuild();

  const cssFiles = walkFiles(cssRoot, (file) => file.endsWith(".css"));
  if (cssFiles.length === 0) {
    throw new Error(`No built CSS files found under ${cssRoot}`);
  }

  const css = cssFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const missing = [...expectedClasses]
    .filter((className) => {
      const escaped = escapeClassName(className);
      return !css.includes(`.${escaped}`) && !css.includes(className);
    })
    .sort();

  const summary = {
    htmlFiles: htmlFiles.map((file) => relative(root, file)),
    cssFiles: cssFiles.map((file) => relative(root, file)),
    expectedClassCount: expectedClasses.size,
    missingClassCount: missing.length,
    missing
  };

  if (missing.length > 0) {
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
