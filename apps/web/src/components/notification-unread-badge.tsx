"use client";

import { useEffect, useState } from "react";

export function NotificationUnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      try {
        const response = await fetch("/api/notifications/unread-count", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const body = (await response.json()) as {
          data?: { count?: number };
        };
        if (!cancelled) setCount(body.data?.count ?? 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void loadCount();
    return () => {
      cancelled = true;
    };
  }, []);

  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={`읽지 않은 알림 ${label}개`}
      className="inline-flex min-w-6 justify-center rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white"
    >
      {label}
    </span>
  );
}
