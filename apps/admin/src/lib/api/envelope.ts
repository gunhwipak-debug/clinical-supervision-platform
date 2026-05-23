import { NextResponse } from "next/server";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiStatus = 200 | 401 | 403 | 404 | 409 | 422 | 423;

export function envelope<TData>(
  data: TData,
  error: ApiError | null,
  status: ApiStatus
) {
  return NextResponse.json(
    { data, error },
    {
      status,
      headers: {
        "X-Robots-Tag": "noindex"
      }
    }
  );
}

export function apiError(code: string, message: string): ApiError {
  return { code, message };
}
