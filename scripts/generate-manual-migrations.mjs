import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const migrationsDir = join(root, "packages/db/drizzle");
const outputPath = join(
  root,
  "apps/web/src/lib/ops/netlify-migrations.generated.ts"
);

const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => /^\d{4}_.+\.sql$/u.test(file))
  .sort();

const migrations = migrationFiles.map((file) => ({
  name: migrationName(file),
  sql: readFileSync(join(migrationsDir, file), "utf8")
}));

const source = `export type ManualMigration = {
  name: string;
  sql: string;
};

export const manualMigrations = ${JSON.stringify(
  migrations,
  null,
  2
)} satisfies ManualMigration[];
`;

writeFileSync(outputPath, source);
console.log(
  `Generated ${migrations.length} manual migrations at ${outputPath.replace(
    `${root}/`,
    ""
  )}`
);

function migrationName(file) {
  const match = /^(?<number>\d{4})_(?<slug>.+)\.sql$/u.exec(file);
  if (!match?.groups) {
    throw new Error(`Invalid migration filename: ${file}`);
  }

  return `${match.groups.number}_${match.groups.slug.replaceAll("_", "-")}`;
}
