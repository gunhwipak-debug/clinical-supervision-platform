import { profiles } from "@csp/db";
import { envelope } from "@/lib/api/envelope";
import { createRuntimeDatabase } from "@/lib/auth/database";

export const runtime = "nodejs";

export async function GET() {
  const db = createRuntimeDatabase();
  const specialties = await profiles.listSpecialtyCatalog(db);

  return envelope({ specialties }, null, 200);
}
