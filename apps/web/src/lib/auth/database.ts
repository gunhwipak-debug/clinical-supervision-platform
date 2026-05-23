import { createDatabase } from "@csp/db";

export function createAuthDatabase() {
  return createDatabase(process.env["SERVICE_DATABASE_URL"]);
}

export function createRuntimeDatabase() {
  return createDatabase(process.env["DATABASE_URL"]);
}
