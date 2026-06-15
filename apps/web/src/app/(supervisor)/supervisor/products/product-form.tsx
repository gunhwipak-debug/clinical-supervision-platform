"use client";

import type { profiles } from "@csp/db";
import { PauseCircle, PlusCircle, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";

export type ManagedProduct = Pick<
  profiles.Product,
  "active" | "description" | "id" | "kind" | "priceKrw" | "title" | "turnaroundHours"
>;

export function ProductForm() {
  const [message, setMessage] = useState("");

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let response: Response;
    try {
      response = await fetch("/api/me/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(productPayload(form))
      });
    } catch {
      const next = productErrorMessage("server_unavailable", "추가 실패");
      setMessage(next);
      toast.error(next);
      return;
    }

    const body = await safeJson(response);
    const next = response.ok
      ? "슈퍼비전 방식을 추가했습니다."
      : productErrorMessage(body.error?.code, "추가 실패");
    setMessage(next);
    if (response.ok) {
      toast.success(next);
      event.currentTarget.reset();
      window.location.reload();
    } else {
      toast.error(next);
    }
  }

  return (
    <Card className="rounded-xl">
      <form className="grid gap-4" onSubmit={submit}>
        <div>
          <h2 className="text-xl font-bold">슈퍼비전 방식 추가</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            신청자가 슈퍼비전 전에 선택할 수 있는 세션 유형입니다.
          </p>
        </div>
        <Field>
          <Label htmlFor="title">세션명</Label>
          <Input id="title" name="title" required />
        </Field>
        <Field>
          <Label htmlFor="kind">유형</Label>
          <select
            className="h-11 rounded-lg border border-line bg-surface-elevated px-3"
            id="kind"
            name="kind"
          >
            <ProductKindOptions />
          </select>
        </Field>
        <Field>
          <Label htmlFor="description">설명</Label>
          <Textarea id="description" name="description" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Label htmlFor="priceKrw">가격</Label>
            <Input
              defaultValue={120000}
              id="priceKrw"
              min={10000}
              name="priceKrw"
              required
              type="number"
            />
          </Field>
          <Field>
            <Label htmlFor="turnaroundHours">응답 시간</Label>
            <Input
              defaultValue={72}
              id="turnaroundHours"
              min={1}
              name="turnaroundHours"
              required
              type="number"
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">
            <PlusCircle aria-hidden size={16} />
            슈퍼비전 방식 추가
          </Button>
          {message ? (
            <p className="text-sm font-semibold text-brand-700">{message}</p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

export function ProductManageForm({ product }: { product: ManagedProduct }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    let response: Response;
    try {
      response = await fetch(`/api/me/products/${product.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(productPayload(form))
      });
    } catch {
      const next = productErrorMessage("server_unavailable", "슈퍼비전 방식 저장 실패");
      setMessage(next);
      setBusy(false);
      toast.error(next);
      return;
    }

    const body = await safeJson(response);
    const next = response.ok
      ? "슈퍼비전 방식을 저장했습니다."
      : productErrorMessage(body.error?.code, "슈퍼비전 방식 저장 실패");
    setMessage(next);
    setBusy(false);
    if (response.ok) {
      toast.success(next);
      window.location.reload();
    } else {
      toast.error(next);
    }
  }

  async function deactivate() {
    if (!window.confirm("이 슈퍼비전 방식을 공개 목록에서 중지할까요?")) return;
    setBusy(true);
    let response: Response;
    try {
      response = await fetch(`/api/me/products/${product.id}`, {
        method: "DELETE"
      });
    } catch {
      const next = productErrorMessage("server_unavailable", "슈퍼비전 방식 중지 실패");
      setMessage(next);
      setBusy(false);
      toast.error(next);
      return;
    }

    const body = await safeJson(response);
    const next = response.ok
      ? "슈퍼비전 방식 운영을 중지했습니다."
      : productErrorMessage(body.error?.code, "슈퍼비전 방식 중지 실패");
    setMessage(next);
    setBusy(false);
    if (response.ok) {
      toast.success(next);
      window.location.reload();
    } else {
      toast.error(next);
    }
  }

  return (
    <form className="grid gap-3 border-t border-line pt-4" onSubmit={update}>
      <Field>
        <Label htmlFor={`title-${product.id}`}>세션명</Label>
        <Input
          defaultValue={product.title}
          id={`title-${product.id}`}
          name="title"
          required
        />
      </Field>
      <Field>
        <Label htmlFor={`kind-${product.id}`}>유형</Label>
        <select
          className="h-11 rounded-lg border border-line bg-surface-elevated px-3"
          defaultValue={product.kind}
          id={`kind-${product.id}`}
          name="kind"
        >
          <ProductKindOptions />
        </select>
      </Field>
      <Field>
        <Label htmlFor={`description-${product.id}`}>설명</Label>
        <Textarea
          defaultValue={product.description ?? ""}
          id={`description-${product.id}`}
          name="description"
          rows={3}
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field>
          <Label htmlFor={`priceKrw-${product.id}`}>가격</Label>
          <Input
            defaultValue={product.priceKrw}
            id={`priceKrw-${product.id}`}
            min={10000}
            name="priceKrw"
            required
            type="number"
          />
        </Field>
        <Field>
          <Label htmlFor={`turnaroundHours-${product.id}`}>응답 시간</Label>
          <Input
            defaultValue={product.turnaroundHours ?? 72}
            id={`turnaroundHours-${product.id}`}
            min={1}
            name="turnaroundHours"
            required
            type="number"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={busy} size="sm" type="submit">
          <Save aria-hidden size={16} />
          저장
        </Button>
        {product.active ? (
          <Button
            disabled={busy}
            onClick={() => void deactivate()}
            size="sm"
            type="button"
            variant="secondary"
          >
            <PauseCircle aria-hidden size={16} />
            운영 중지
          </Button>
        ) : (
          <span className="rounded-md bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-500">
            중지된 슈퍼비전 방식
          </span>
        )}
        {message ? (
          <p className="text-sm font-semibold text-brand-700">{message}</p>
        ) : null}
      </div>
    </form>
  );
}

function ProductKindOptions() {
  return (
    <>
      <option value="async_comment">비동기 코멘트</option>
      <option value="async_direct_edit">비동기 직접 수정</option>
      <option value="zoom_60">화상 회의 60분</option>
      <option value="zoom_90">화상 회의 90분</option>
      <option value="urgent_24h">24시간 긴급 검토</option>
    </>
  );
}

function productPayload(form: FormData) {
  return {
    kind: formString(form, "kind") || "async_comment",
    title: formString(form, "title").trim(),
    description: emptyToNull(form.get("description")),
    priceKrw: Number(form.get("priceKrw")),
    turnaroundHours: Number(form.get("turnaroundHours") || 72)
  };
}

function productErrorMessage(code: string | undefined, fallback: string): string {
  const labels: Record<string, string> = {
    forbidden: "슈퍼바이저 계정에서만 슈퍼비전 방식을 관리할 수 있습니다.",
    invalid_request: "슈퍼비전 방식 정보를 다시 확인해주세요.",
    not_found: "요청한 슈퍼비전 방식을 찾을 수 없습니다.",
    profile_required: "먼저 공개 프로필을 저장해주세요.",
    server_unavailable:
      "일시적인 문제로 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? fallback;
}

async function safeJson(response: Response): Promise<{ error?: { code?: string } }> {
  try {
    return (await response.json()) as { error?: { code?: string } };
  } catch {
    return {};
  }
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
