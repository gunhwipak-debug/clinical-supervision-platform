"use client";

import { useState } from "react";

const adminLinks = [
  { href: "/admin", label: "운영 처리 목록" },
  { href: "/admin/queue", label: "운영 대기열" },
  { href: "/admin/qualifications", label: "자격 심사" },
  { href: "/admin/refunds", label: "환불 검토" },
  { href: "/admin/payouts", label: "정산 확인" },
  { href: "/admin/audit", label: "처리 기록" }
] as const;

export function AdminAccountMenu({
  currentPath,
  email
}: {
  currentPath?: string | undefined;
  email: string;
}) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg border border-line bg-surface-elevated px-3 py-2 text-left transition hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white"
        >
          {email.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block text-sm font-bold text-ink-900">관리자</span>
          <span className="block max-w-44 truncate text-xs font-semibold text-ink-500">
            {email}
          </span>
        </span>
        <span className="material-symbols-outlined text-base text-ink-400">
          expand_more
        </span>
      </summary>

      <div className="absolute right-0 top-12 z-50 grid max-h-[72vh] w-[300px] gap-2 overflow-y-auto rounded-xl border border-line bg-surface-elevated p-2 shadow-[0_18px_36px_rgba(8,18,37,0.12)]">
        <div className="border-b border-line px-3 py-3">
          <p className="text-sm font-bold text-ink-900">관리자</p>
          <p className="mt-1 truncate text-xs font-semibold text-ink-500">{email}</p>
        </div>

        <div className="grid gap-1">
          <p className="px-3 pt-2 text-xs font-bold text-ink-400">운영</p>
          {adminLinks.map((item) => (
            <a
              aria-current={currentPath === item.href ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                currentPath === item.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-800 hover:bg-surface-sunken"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="grid gap-1 border-t border-line pt-2">
          <button
            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink-800 hover:bg-surface-sunken disabled:opacity-50"
            disabled={busy}
            onClick={() => void logout()}
            type="button"
          >
            {busy ? "로그아웃 중" : "로그아웃"}
          </button>
        </div>
      </div>
    </details>
  );
}
