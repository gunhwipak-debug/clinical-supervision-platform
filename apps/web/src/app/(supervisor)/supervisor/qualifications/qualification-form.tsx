"use client";

import { PlusCircle } from "lucide-react";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Field, Input, Label } from "../../../../components/ui/form";

export function QualificationForm() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("증빙 파일을 업로드하는 중입니다.");
    const form = new FormData(event.currentTarget);
    const evidence = form.get("evidence");
    if (!(evidence instanceof File) || evidence.size === 0) {
      setSubmitting(false);
      setMessage("자격 증빙 파일을 첨부해주세요.");
      toast.error("자격 증빙 파일을 첨부해주세요.");
      return;
    }

    const evidenceResult = await uploadEvidence(evidence);
    if (!evidenceResult.ok) {
      setSubmitting(false);
      setMessage(evidenceResult.message);
      toast.error(evidenceResult.message);
      return;
    }

    setMessage("자격 정보를 제출하는 중입니다.");
    const response = await fetch("/api/me/qualifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formString(form, "name").trim(),
        number: emptyToNull(form.get("number")),
        issuingBody: emptyToNull(form.get("issuingBody")),
        issuedAt: emptyToNull(form.get("issuedAt")),
        expiresAt: emptyToNull(form.get("expiresAt")),
        evidenceFileId: evidenceResult.evidenceId
      })
    });
    const body = (await response.json()) as { error?: { code: string } };
    const next = response.ok
      ? "자격을 승인 대기 상태로 제출했습니다."
      : qualificationErrorMessage(body.error?.code);
    setMessage(next);
    setSubmitting(false);
    if (response.ok) {
      toast.success(next);
      event.currentTarget.reset();
      window.location.reload();
    } else {
      toast.error(next);
    }
  }

  return (
    <Card className="rounded-2xl">
      <form className="grid gap-4" onSubmit={submit}>
        <div>
          <h2 className="text-xl font-bold">자격 제출</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            제출된 자격은 운영자 승인 전까지 승인 대기 상태로 표시됩니다.
          </p>
        </div>
        <Field>
          <Label htmlFor="name">자격명</Label>
          <Input id="name" name="name" required />
        </Field>
        <Field>
          <Label htmlFor="number">자격번호</Label>
          <Input id="number" name="number" placeholder="예: KCP-2024-0000" required />
        </Field>
        <Field>
          <Label htmlFor="issuingBody">발급 기관</Label>
          <Input id="issuingBody" name="issuingBody" required />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="issuedAt">발급일</Label>
            <Input id="issuedAt" name="issuedAt" required type="date" />
          </Field>
          <Field>
            <Label htmlFor="expiresAt">만료일</Label>
            <Input id="expiresAt" name="expiresAt" type="date" />
          </Field>
        </div>
        <Field>
          <Label htmlFor="evidence">자격 증빙 파일</Label>
          <Input
            accept=".pdf,.png,.jpg,.jpeg,.webp,.hwp,.hwpx,.docx,.xlsx,.txt,.md,.csv,.json"
            id="evidence"
            name="evidence"
            required
            type="file"
          />
          <p className="text-xs leading-relaxed text-ink-500">
            자격증 사본, 발급기관 확인서, 면허 조회 결과 등 운영자가 검토할 수 있는
            파일을 첨부해주세요.
          </p>
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={submitting} type="submit">
            <PlusCircle aria-hidden size={16} />
            {submitting ? "제출 중" : "자격 제출"}
          </Button>
          {message ? (
            <p className="text-sm font-semibold text-brand-700">{message}</p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

async function uploadEvidence(
  file: File
): Promise<{ ok: true; evidenceId: string } | { ok: false; message: string }> {
  const uploadResponse = await fetch("/api/me/qualification-evidence/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || null,
      sizeBytes: file.size
    })
  });
  const uploadBody = (await uploadResponse.json()) as {
    data?: { uploadKey: string; url: string; contentType: string };
    error?: { code?: string };
  };
  if (!uploadResponse.ok || !uploadBody.data) {
    return {
      ok: false,
      message: qualificationErrorMessage(uploadBody.error?.code)
    };
  }

  const putResponse = await fetch(uploadBody.data.url, {
    method: "PUT",
    headers: { "content-type": uploadBody.data.contentType },
    body: file
  });
  if (!putResponse.ok) {
    return { ok: false, message: "증빙 파일 업로드에 실패했습니다." };
  }

  const registerResponse = await fetch("/api/me/qualification-evidence", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      uploadKey: uploadBody.data.uploadKey,
      originalFilename: file.name,
      mimeType: uploadBody.data.contentType,
      sizeBytes: file.size
    })
  });
  const registerBody = (await registerResponse.json()) as {
    data?: { evidence?: { id: string } };
    error?: { code?: string };
  };
  if (!registerResponse.ok || !registerBody.data?.evidence?.id) {
    return {
      ok: false,
      message: qualificationErrorMessage(registerBody.error?.code)
    };
  }

  return { ok: true, evidenceId: registerBody.data.evidence.id };
}

function qualificationErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    evidence_required: "자격 증빙 파일을 먼저 업로드해주세요.",
    invalid_file: "파일 형식이 올바르지 않습니다.",
    invalid_request: "입력 형식이 올바르지 않습니다.",
    profile_required: "먼저 슈퍼바이저 프로필을 등록해주세요.",
    size_mismatch: "파일 크기가 일치하지 않습니다.",
    unsupported_file_type: "지원하지 않는 파일 형식입니다.",
    upload_missing: "업로드된 증빙 파일을 찾을 수 없습니다.",
    virus_detected: "악성 파일로 의심되어 등록할 수 없습니다."
  };
  return labels[code ?? ""] ?? "자격 제출에 실패했습니다.";
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
