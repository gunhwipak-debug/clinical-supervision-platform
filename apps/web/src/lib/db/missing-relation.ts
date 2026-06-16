export function isMissingDatabaseRelation(error: unknown): boolean {
  const messages = collectErrorMessages(error);
  return messages.some(
    (message) => message.includes("relation ") && message.includes("does not exist")
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

  return [safeStringifyError(error)];
}

function safeStringifyError(error: unknown): string {
  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean") return String(error);
  return "";
}
