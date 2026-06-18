"use client";

import type { profiles } from "@csp/db";
import { PauseCircle, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  feedbackDeadlineLabel,
  liveSessionDurations,
  standardSupervisionMethods,
  type SupervisionMethodCatalogItem
} from "@/lib/supervision-method-catalog";
import { Button } from "../../../../components/ui/button";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";

export type ManagedProduct = Pick<
  profiles.Product,
  "active" | "description" | "id" | "kind" | "priceKrw" | "title" | "turnaroundHours"
>;

type MethodDraft = {
  active: boolean;
  description: string;
  priceKrw: number;
  turnaroundHours: number | null;
};

export function ProductCatalogForm({ products }: { products: ManagedProduct[] }) {
  const initialDrafts = useMemo(() => buildInitialDrafts(products), [products]);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function updateDraft(code: profiles.ServiceProductKind, next: Partial<MethodDraft>) {
    setDrafts((current) => ({
      ...current,
      [code]: {
        ...current[code],
        ...next
      }
    }));
  }

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("저장 중입니다.");

    try {
      for (const method of standardSupervisionMethods) {
        const draft = drafts[method.code];
        const response = await fetch("/api/me/products", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            active: draft.active,
            description: draft.description.trim() || method.defaultDescription,
            kind: method.code,
            priceKrw: draft.priceKrw,
            title: method.name,
            turnaroundHours:
              method.deliveryMode === "live_video"
                ? (draft.turnaroundHours ?? method.defaultTurnaroundHours)
                : draft.turnaroundHours
          })
        });
        if (!response.ok) {
          const body = await safeJson(response);
          throw new Error(productErrorMessage(body.error?.code));
        }
      }
    } catch (error) {
      const next =
        error instanceof Error ? error.message : "슈퍼비전 방식을 저장하지 못했습니다.";
      setMessage(next);
      setBusy(false);
      toast.error(next);
      return;
    }

    const next = "슈퍼비전 방식을 저장했습니다.";
    setMessage(next);
    setBusy(false);
    toast.success(next);
    window.location.reload();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="overflow-hidden rounded-lg border border-line bg-surface-elevated">
        <div className="grid grid-cols-[minmax(0,1fr)_132px_152px_116px] gap-4 border-b border-line bg-surface-sunken px-5 py-3 text-xs font-bold text-ink-500">
          <span>슈퍼비전 방식</span>
          <span className="text-right">가격</span>
          <span className="text-right">제공 조건</span>
          <span className="text-right">신청 가능</span>
        </div>
        <div className="divide-y divide-line">
          {standardSupervisionMethods.map((method) => {
            const draft = drafts[method.code];
            const durationText =
              method.deliveryMode === "live_video"
                ? `${String(draft.turnaroundHours ?? method.defaultTurnaroundHours)}분`
                : feedbackDeadlineLabel(draft.turnaroundHours);

            return (
              <section className="grid gap-4 px-5 py-5" key={method.code}>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_132px_152px_116px] md:items-start">
                  <div className="min-w-0">
                    <label className="flex items-start gap-3">
                      <input
                        checked={draft.active}
                        className="mt-1 size-4"
                        onChange={(event) =>
                          updateDraft(method.code, {
                            active: event.currentTarget.checked
                          })
                        }
                        type="checkbox"
                      />
                      <span>
                        <span className="block text-base font-bold text-ink-900">
                          {method.name}
                        </span>
                        <span className="mt-1 block break-keep text-sm leading-6 text-ink-500">
                          {method.defaultDescription}
                        </span>
                      </span>
                    </label>
                  </div>
                  <label className="grid gap-1 md:text-right">
                    <span className="text-xs font-bold text-ink-400">가격</span>
                    <Input
                      className="md:text-right"
                      disabled={!draft.active}
                      min={10_000}
                      onChange={(event) =>
                        updateDraft(method.code, {
                          priceKrw: Number(event.currentTarget.value)
                        })
                      }
                      type="number"
                      value={draft.priceKrw}
                    />
                    <span className="text-xs font-semibold text-ink-400">
                      {draft.priceKrw.toLocaleString("ko-KR")}원
                    </span>
                  </label>
                  <label className="grid gap-1 md:text-right">
                    <span className="text-xs font-bold text-ink-400">
                      {method.settingLabel}
                    </span>
                    {method.deliveryMode === "live_video" ? (
                      <select
                        className="h-11 rounded-lg border border-line bg-surface-elevated px-3 text-sm font-semibold text-ink-900 disabled:opacity-60"
                        disabled={!draft.active}
                        onChange={(event) =>
                          updateDraft(method.code, {
                            turnaroundHours: Number(event.currentTarget.value)
                          })
                        }
                        value={draft.turnaroundHours ?? 90}
                      >
                        {liveSessionDurations.map((minutes) => (
                          <option key={minutes} value={minutes}>
                            {minutes}분
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className="md:text-right"
                        disabled={!draft.active}
                        min={1}
                        onChange={(event) =>
                          updateDraft(method.code, {
                            turnaroundHours: Number(event.currentTarget.value)
                          })
                        }
                        type="number"
                        value={draft.turnaroundHours ?? method.defaultTurnaroundHours}
                      />
                    )}
                    <span className="text-xs font-semibold text-ink-400">
                      {durationText}
                    </span>
                  </label>
                  <div className="md:text-right">
                    <span
                      className={`inline-flex rounded-md px-3 py-1 text-sm font-bold ${
                        draft.active
                          ? "bg-brand-50 text-brand-700"
                          : "bg-surface-sunken text-ink-500"
                      }`}
                    >
                      {draft.active ? "신청 가능" : "숨김"}
                    </span>
                  </div>
                </div>
                {draft.active ? (
                  <div className="grid gap-2 border-l-2 border-brand-100 pl-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-ink-900">
                        신청자 안내
                      </span>
                      <Textarea
                        onChange={(event) =>
                          updateDraft(method.code, {
                            description: event.currentTarget.value
                          })
                        }
                        rows={2}
                        value={draft.description}
                      />
                    </label>
                    <p className="break-keep text-sm leading-6 text-ink-500">
                      {method.helpText}
                    </p>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={busy} type="submit">
          <Save aria-hidden size={16} />
          {busy ? "저장 중..." : "슈퍼비전 방식 저장"}
        </Button>
        {message ? (
          <p aria-live="polite" className="text-sm font-semibold text-brand-700">
            {message}
          </p>
        ) : null}
      </div>
    </form>
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
      const next = productErrorMessage("server_unavailable");
      setMessage(next);
      setBusy(false);
      toast.error(next);
      return;
    }

    const body = await safeJson(response);
    const next = response.ok
      ? "기존 슈퍼비전 방식을 저장했습니다."
      : productErrorMessage(body.error?.code);
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
    if (!window.confirm("이 기존 방식을 신청 목록에서 숨길까요?")) return;
    setBusy(true);
    let response: Response;
    try {
      response = await fetch(`/api/me/products/${product.id}`, {
        method: "DELETE"
      });
    } catch {
      const next = productErrorMessage("server_unavailable");
      setMessage(next);
      setBusy(false);
      toast.error(next);
      return;
    }

    const body = await safeJson(response);
    const next = response.ok
      ? "기존 방식을 숨겼습니다."
      : productErrorMessage(body.error?.code);
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
        <Label htmlFor={`title-${product.id}`}>표시 이름</Label>
        <Input
          defaultValue={product.title}
          id={`title-${product.id}`}
          name="title"
          required
        />
      </Field>
      <input name="kind" type="hidden" value={product.kind} />
      <Field>
        <Label htmlFor={`description-${product.id}`}>신청자 안내</Label>
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
            min={10_000}
            name="priceKrw"
            required
            type="number"
          />
        </Field>
        <Field>
          <Label htmlFor={`turnaroundHours-${product.id}`}>피드백 제공 기한</Label>
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
            숨기기
          </Button>
        ) : (
          <span className="rounded-md bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-500">
            신청 목록에서 숨김
          </span>
        )}
        {message ? (
          <p className="text-sm font-semibold text-brand-700">{message}</p>
        ) : null}
      </div>
    </form>
  );
}

function buildInitialDrafts(products: ManagedProduct[]) {
  const byKind = new Map(products.map((product) => [product.kind, product]));

  return Object.fromEntries(
    standardSupervisionMethods.map((method) => {
      const product = byKind.get(method.code);
      return [
        method.code,
        {
          active: product?.active ?? false,
          description: product?.description ?? method.defaultDescription,
          priceKrw: product?.priceKrw ?? method.defaultPriceKrw,
          turnaroundHours: product?.turnaroundHours ?? method.defaultTurnaroundHours
        }
      ] satisfies [profiles.ServiceProductKind, MethodDraft];
    })
  ) as Record<SupervisionMethodCatalogItem["code"], MethodDraft>;
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

function productErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    forbidden: "슈퍼바이저 계정에서만 슈퍼비전 방식을 관리할 수 있습니다.",
    invalid_request: "슈퍼비전 방식 정보를 다시 확인해주세요.",
    not_found: "요청한 슈퍼비전 방식을 찾을 수 없습니다.",
    profile_required: "먼저 공개 프로필을 저장해주세요.",
    server_unavailable:
      "일시적인 문제로 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "슈퍼비전 방식을 저장하지 못했습니다.";
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
