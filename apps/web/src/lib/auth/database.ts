import { createDatabase } from "@csp/db";

export function createAuthDatabase() {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];

  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error("SERVICE_DATABASE_URL is required");
  }

  return createDatabase(serviceUrl);
}

export function createRuntimeDatabase() {
  const runtimeUrl = process.env["DATABASE_URL"];

  if (!runtimeUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error("DATABASE_URL is required");
  }

  return createDatabase(runtimeUrl);
}
