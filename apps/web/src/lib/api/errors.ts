import { apiError, envelope } from "./envelope";

export function serverUnavailable(
  scope: string,
  error: unknown,
  message = "일시적인 문제로 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
) {
  console.error(scope, describeError(error));
  return envelope(null, apiError("server_unavailable", message), 503);
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
