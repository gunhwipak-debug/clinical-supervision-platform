"use client";

import { useState } from "react";

const minReasonLength = 30;

export function AdminDownloadLink({
  filename,
  url
}: {
  filename: string;
  url: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function download() {
    const reason = window.prompt(
      "증빙 원본을 내려받는 관리자 사유를 30자 이상 입력하세요."
    );
    if (!reason) return;
    if (reason.trim().length < minReasonLength) {
      setMessage("관리자 사유는 30자 이상이어야 합니다.");
      return;
    }

    setIsBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        headers: { "x-admin-reason": reason.trim() }
      });
      if (!response.ok) {
        setMessage("증빙 파일을 내려받지 못했습니다.");
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage("다운로드 감사 사유가 기록되었습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        className="w-fit font-semibold text-brand-600 underline disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isBusy}
        onClick={() => void download()}
        type="button"
      >
        {isBusy ? "다운로드 준비 중" : filename}
      </button>
      {message ? (
        <span className="text-xs font-semibold text-ink-500">{message}</span>
      ) : null}
    </span>
  );
}
