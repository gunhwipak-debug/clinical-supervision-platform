import { createDatabase, closeDevDatabase } from "../../packages/db/src/client";
import { seedDemoData } from "../../packages/db/src/dev-seed";

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("Missing DATABASE_URL environment variable");
    process.exit(1);
  }
  console.log("Starting Neon Production Database Seeding...");

  // PGlite 모드로 오인되지 않도록 환경 변수를 제거합니다.
  delete process.env["DEV_DB"];
  delete process.env["DEV_DB_PATH"];

  const db = createDatabase();
  await seedDemoData(db, console.log);
  await closeDevDatabase();
  
  console.log("✅ Neon Production Database Seeding Completed Successfully!");
}

main().catch((err) => {
  console.error("✖ Failed to seed Neon production:", err);
  process.exit(1);
});
