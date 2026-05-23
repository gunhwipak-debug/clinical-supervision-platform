"use client";

import { AdminCard, AdminShell } from "../components/admin-shell";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminShell title="운영 화면 오류" subtitle="요청 처리 중 문제가 생겼습니다.">
      <AdminCard className="grid gap-3 border-danger/30">
        <h2 className="font-bold text-danger">잠시 흐름이 끊겼어요</h2>
        <p className="text-sm text-ink-500">
          다시 시도해도 반복되면 아래 코드를 함께 전달해주세요.
        </p>
        <code className="w-fit rounded-sm bg-surface-sunken px-2 py-1 text-xs text-ink-700">
          {error.digest ?? error.message}
        </code>
        <button
          className="w-fit rounded-md border border-line bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink-700"
          onClick={reset}
          type="button"
        >
          다시 시도
        </button>
      </AdminCard>
    </AdminShell>
  );
}
