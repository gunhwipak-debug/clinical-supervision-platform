"use client";

import { AppShell } from "../components/app-shell";
import { ErrorState } from "../components/ui/state";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell
      title="다시 시도해 볼게요"
      subtitle="요청 처리 중 문제가 생겼습니다."
      action={
        <button
          className="rounded-md border border-line bg-surface-elevated px-4 py-2 text-sm font-semibold text-ink-700"
          onClick={reset}
          type="button"
        >
          다시 시도
        </button>
      }
    >
      <ErrorState code={error.digest ?? error.message} />
    </AppShell>
  );
}
