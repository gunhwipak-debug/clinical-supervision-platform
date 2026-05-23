"use client";

import type { profiles } from "@csp/db";
import { Eye, EyeOff, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";

export function SupervisorProfileForm({
  profile
}: {
  profile: profiles.SupervisorProfile | null;
}) {
  const [message, setMessage] = useState("");

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const years = formString(form, "yearsOfExperience").trim();
    const response = await fetch("/api/me/supervisor-profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: formString(form, "displayName").trim(),
        photoUrl: emptyToNull(form.get("photoUrl")),
        headline: emptyToNull(form.get("headline")),
        bio: emptyToNull(form.get("bio")),
        yearsOfExperience: years ? Number(years) : null
      })
    });
    const body = (await response.json()) as { error?: { code: string } };
    const next = response.ok
      ? "프로필을 저장했습니다."
      : (body.error?.code ?? "저장 실패");
    setMessage(next);
    if (response.ok) toast.success(next);
    else toast.error(next);
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div>
        <h2 className="text-xl font-bold">공개 프로필</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          모집 URL로 들어온 슈퍼바이저가 처음 완성해야 하는 소개 정보입니다.
        </p>
      </div>
      <Field>
        <Label htmlFor="displayName">공개 표시명</Label>
        <Input
          defaultValue={profile?.displayName ?? ""}
          id="displayName"
          name="displayName"
          required
        />
      </Field>
      <Field>
        <Label htmlFor="headline">헤드라인</Label>
        <Input defaultValue={profile?.headline ?? ""} id="headline" name="headline" />
      </Field>
      <Field>
        <Label htmlFor="photoUrl">프로필 사진 URL</Label>
        <Input
          defaultValue={profile?.photoUrl ?? ""}
          id="photoUrl"
          name="photoUrl"
          placeholder="실제 프로필 사진 URL을 입력하거나 비워두세요."
          type="url"
        />
      </Field>
      <Field>
        <Label htmlFor="bio">소개</Label>
        <Textarea defaultValue={profile?.bio ?? ""} id="bio" name="bio" rows={7} />
      </Field>
      <Field>
        <Label htmlFor="yearsOfExperience">경력 연수</Label>
        <Input
          defaultValue={profile?.yearsOfExperience ?? ""}
          id="yearsOfExperience"
          min={0}
          name="yearsOfExperience"
          type="number"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">
          <Save aria-hidden size={16} />
          프로필 저장
        </Button>
        {message ? (
          <p className="text-sm font-semibold text-brand-700">{message}</p>
        ) : null}
      </div>
    </form>
  );
}

export function SupervisorVisibilityForm({
  canPublish,
  initialVisibility,
  publishBlockedReason
}: {
  canPublish: boolean;
  initialVisibility: "hidden" | "public" | "private" | null;
  publishBlockedReason: string | null;
}) {
  const [visibility, setVisibility] = useState(initialVisibility ?? "hidden");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(nextVisibility: "hidden" | "public") {
    setBusy(true);
    const response = await fetch("/api/me/supervisor-profile/visibility", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility: nextVisibility })
    });
    const body = (await response.json()) as {
      data?: { profile?: { visibility?: "hidden" | "public" | "private" } };
      error?: { code?: string; message?: string };
    };
    const next = response.ok
      ? nextVisibility === "public"
        ? "검색 공개로 전환했습니다."
        : "비공개로 전환했습니다."
      : visibilityError(body.error?.code, body.error?.message);

    setBusy(false);
    setMessage(next);
    if (response.ok) {
      setVisibility(body.data?.profile?.visibility ?? nextVisibility);
      toast.success(next);
      return;
    }
    toast.error(next);
  }

  return (
    <div className="grid gap-3">
      <div>
        <h2 className="font-bold text-ink-900">공개 상태</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          검색 공개는 승인된 자격과 2단계 인증이 모두 충족될 때만 가능합니다.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          disabled={busy || visibility === "hidden"}
          onClick={() => void update("hidden")}
          type="button"
          variant={visibility === "hidden" ? "primary" : "secondary"}
        >
          <EyeOff aria-hidden size={16} />
          비공개
        </Button>
        <Button
          disabled={busy || visibility === "public" || !canPublish}
          onClick={() => void update("public")}
          type="button"
          variant={visibility === "public" ? "primary" : "secondary"}
        >
          <Eye aria-hidden size={16} />
          검색 공개
        </Button>
      </div>
      {!canPublish && publishBlockedReason ? (
        <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-700">
          {publishBlockedReason}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm font-semibold text-brand-700">{message}</p>
      ) : null}
    </div>
  );
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function visibilityError(code: string | undefined, fallback?: string): string {
  const labels: Record<string, string> = {
    "2fa_required": "검색 공개 전환 전에 2단계 인증을 설정해주세요.",
    forbidden: "슈퍼바이저 계정에서만 공개 상태를 바꿀 수 있습니다.",
    invalid_request: "공개 상태 값을 다시 확인해주세요.",
    not_found: "먼저 프로필을 저장해주세요.",
    unauthorized: "로그인이 필요합니다.",
    verification_required: "승인된 자격 정보가 있어야 검색 공개로 전환할 수 있습니다."
  };
  return labels[code ?? ""] ?? fallback ?? "공개 상태 변경에 실패했습니다.";
}
