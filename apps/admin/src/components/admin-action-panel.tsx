"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminAction = {
  label: string;
  url: string;
  tone: "primary" | "secondary";
  disabledReason?: string;
};

export function AdminActionPanel({
  actions,
  reasonPlaceholder,
  reasonLabel = "관리자 사유"
}: {
  actions: AdminAction[];
  reasonPlaceholder: string;
  reasonLabel?: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(action: AdminAction) {
    setBusyAction(action.url);
    setMessage(null);
    try {
      const response = await fetch(action.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason })
      });
      const body = (await response.json().catch(() => null)) as {
        error?: { code?: string; message?: string } | null;
      } | null;

      if (!response.ok) {
        setMessage(body?.error?.message ?? body?.error?.code ?? "처리 실패");
        return;
      }

      setMessage("처리되었습니다.");
      router.refresh();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-brand-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
      <label className="grid gap-2 text-sm font-semibold text-ink-700">
        <span>{reasonLabel}</span>
        <textarea
          className="min-h-24 rounded-2xl border border-line bg-surface-elevated px-3 py-2"
          minLength={30}
          onChange={(event) => setReason(event.target.value)}
          placeholder={reasonPlaceholder}
          value={reason}
        />
        <span className="text-xs font-semibold text-ink-500">
          실제 검토 근거를 30자 이상 직접 입력해야 처리할 수 있습니다.
        </span>
        {message ? (
          <span className="text-xs font-semibold text-ink-500">{message}</span>
        ) : null}
      </label>
      {actions.map((action) => (
        <span className="grid gap-1" key={action.url}>
          <button
            className={
              action.tone === "primary"
                ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
                : "inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
            }
            disabled={
              busyAction !== null ||
              reason.trim().length < 30 ||
              Boolean(action.disabledReason)
            }
            onClick={() => void submit(action)}
            type="button"
          >
            {busyAction === action.url ? "처리 중" : action.label}
          </button>
          {action.disabledReason ? (
            <span className="text-xs font-semibold text-ink-500">
              {action.disabledReason}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
