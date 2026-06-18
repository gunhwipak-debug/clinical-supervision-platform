"use client";

import { useState } from "react";

export function NotificationAction({
  href,
  id,
  read
}: {
  href: string | null;
  id: string;
  read: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function markRead() {
    setBusy(true);
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } finally {
      if (href) {
        window.location.href = href;
      } else {
        window.location.reload();
      }
    }
  }

  return (
    <button
      className="inline-flex shrink-0 items-center justify-center rounded-md border border-line px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
      disabled={busy}
      onClick={() => void markRead()}
      type="button"
    >
      {href ? "업무 화면 열기" : read ? "읽음" : "읽음 처리"}
    </button>
  );
}

export function MarkAllNotificationsRead({ disabled }: { disabled: boolean }) {
  const [busy, setBusy] = useState(false);

  async function markAllRead() {
    setBusy(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } finally {
      window.location.reload();
    }
  }

  return (
    <button
      className="rounded-md border border-line px-3 py-2 text-sm font-bold text-ink-700 transition hover:bg-surface-sunken disabled:opacity-50"
      disabled={disabled || busy}
      onClick={() => void markAllRead()}
      type="button"
    >
      {busy ? "처리 중..." : "모두 읽음"}
    </button>
  );
}
