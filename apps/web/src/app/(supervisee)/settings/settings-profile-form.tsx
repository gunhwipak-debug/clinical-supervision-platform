"use client";

import type { profiles } from "@csp/db";
import type { SyntheticEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Field, Input, Label, Textarea } from "../../../components/ui/form";

type ProfileResponse = {
  data?: { profile?: profiles.SuperviseeProfile | null };
  error?: { code?: string };
};

export function SettingsProfileForm({
  profile
}: {
  profile: profiles.SuperviseeProfile | null;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/me/supervisee-profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName,
        headline: headline.trim().length > 0 ? headline : null
      })
    });
    const body = (await response.json()) as ProfileResponse;
    setSaving(false);

    if (!response.ok || body.error) {
      toast.error(profileError(body.error?.code));
      return;
    }

    setSavedAt(new Date());
    toast.success("슈퍼바이지 프로필을 저장했습니다.");
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
      <Field>
        <Label htmlFor="settings-display-name">표시 이름</Label>
        <Input
          id="settings-display-name"
          maxLength={120}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="예: 홍길동"
          required
          value={displayName}
        />
      </Field>
      <Field>
        <Label htmlFor="settings-headline">소속 또는 소개</Label>
        <Textarea
          id="settings-headline"
          maxLength={180}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="예: 임상심리 수련생, 병원 상담센터 근무"
          rows={3}
          value={headline}
        />
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button disabled={saving} type="submit">
          {saving ? "저장 중" : "프로필 저장"}
        </Button>
        {savedAt ? (
          <span className="text-sm text-ink-500">
            마지막 저장:{" "}
            {new Intl.DateTimeFormat("ko-KR", {
              timeStyle: "short",
              timeZone: "Asia/Seoul"
            }).format(savedAt)}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function profileError(code: string | undefined): string {
  const labels: Record<string, string> = {
    forbidden: "현재 계정에서 프로필을 저장할 수 없습니다.",
    invalid_request: "입력값을 확인해주세요.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "프로필 저장에 실패했습니다.";
}
