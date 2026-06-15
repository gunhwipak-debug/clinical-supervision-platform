export function isMissingDatabaseRelation(error: unknown): boolean {
  const messages = collectErrorMessages(error);
  return messages.some(
    (message) =>
      (message.includes("relation ") && message.includes("does not exist")) ||
      message.includes("DATABASE_URL is required") ||
      message.includes("SERVICE_DATABASE_URL is required")
  );
}

function collectErrorMessages(error: unknown): string[] {
  if (!error) return [];

  if (error instanceof Error) {
    const cause =
      "cause" in error ? (error as Error & { cause?: unknown }).cause : null;
    return [error.message, ...collectErrorMessages(cause)];
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record["message"] === "string" ? record["message"] : "";
    return [message, ...collectErrorMessages(record["cause"])].filter(Boolean);
  }

  return [String(error)];
}
