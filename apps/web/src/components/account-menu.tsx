"use client";

import { useState } from "react";

type AccountNavigationItem = {
  readonly href: string;
  readonly key: string;
  readonly label: string;
};

type AccountNavigationGroup = {
  readonly items: readonly AccountNavigationItem[];
  readonly label: string;
};

export function AccountMenu({
  active,
  email,
  navigation = [],
  roleLabel,
  settingsHref
}: {
  active?: string | undefined;
  email: string;
  navigation?: readonly AccountNavigationGroup[];
  roleLabel: string;
  settingsHref: string;
}) {
  const [busy, setBusy] = useState(false);
  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.href !== settingsHref)
    }))
    .filter((group) => group.items.length > 0);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <details className="group relative">
      <summary
        aria-label="계정 메뉴 열기"
        className="flex cursor-pointer list-none items-center gap-3 rounded-lg border border-line bg-surface-elevated px-3 py-2 text-left transition hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
      >
        <span
          className="grid size-8 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white"
          aria-hidden="true"
        >
          {email.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-bold text-ink-900">
            {roleLabel}
          </span>
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
          <p className="text-sm font-bold text-ink-900">{roleLabel}</p>
          <p className="mt-1 truncate text-xs font-semibold text-ink-500">{email}</p>
        </div>

        {visibleNavigation.map((group) => (
          <div className="grid gap-1" key={group.label}>
            <p className="px-3 pt-2 text-xs font-bold text-ink-400">{group.label}</p>
            {group.items.map((item) => (
              <a
                aria-current={active === item.key ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active === item.key
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-800 hover:bg-surface-sunken"
                }`}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}

        <div className="grid gap-1 border-t border-line pt-2">
          <a
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-surface-sunken"
            href={settingsHref}
          >
            계정 설정
          </a>
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
