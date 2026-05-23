import { createDatabase, closeDevDatabase } from "../../packages/db/src/client";
import { sql } from "drizzle-orm";

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("Missing DATABASE_URL environment variable");
    process.exit(1);
  }
  console.log("Starting Neon Production Database Cleanup (Demo Data OFF)...");

  // PGlite 모드로 오인되지 않도록 환경 변수를 제거합니다.
  delete process.env["DEV_DB"];
  delete process.env["DEV_DB_PATH"];

  const db = createDatabase();

  // 외래 키 의존성이 있으므로 cascade 옵션을 붙여서 모든 테이블을 초기화하고 specialty_catalog와 terms_versions 시드는 보존하기 위해 cascade truncate를 실행합니다.
  await db.execute(sql`
    truncate table 
      reviews, 
      payments, 
      bookings, 
      supervision_requests, 
      availability_slots, 
      service_products, 
      supervisor_specialties, 
      qualifications, 
      supervisor_profiles, 
      supervisee_profiles,
      session_reminders,
      access_logs,
      audit_logs,
      consent_records,
      email_verification_tokens,
      auth_tokens,
      users
    cascade;
  `);

  await closeDevDatabase();
  console.log("✅ Neon Production Database Demo Data OFF Completed Successfully!");
}

main().catch((err) => {
  console.error("✖ Failed to clear Neon production:", err);
  process.exit(1);
});
