"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";

export function SupervisorApplicationButton() {
  const [submitting, setSubmitting] = useState(false);

  async function startApplication() {
    setSubmitting(true);
    const response = await fetch("/api/me/supervisor-application", {
      method: "POST"
    });
    const body = (await response.json()) as { error?: { code?: string } };

    if (response.ok) {
      toast.success("슈퍼바이저 신청을 시작했습니다.");
      window.location.href = "/supervisor/profile";
      return;
    }

    setSubmitting(false);
    toast.error(applicationErrorMessage(body.error?.code));
  }

  return (
    <Button disabled={submitting} onClick={() => void startApplication()} type="button">
      {submitting ? "신청을 여는 중" : "슈퍼바이저 신청 시작"}
    </Button>
  );
}

function applicationErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    forbidden: "이 계정에서는 슈퍼바이저 신청을 시작할 수 없습니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "슈퍼바이저 신청을 시작하지 못했습니다.";
}
