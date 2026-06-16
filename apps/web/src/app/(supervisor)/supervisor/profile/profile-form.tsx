"use client";

import type { profiles } from "@csp/db";
import { CheckCircle2, Eye, EyeOff, Save, UserRoundCog } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";
import { Badge } from "../../../../components/ui/badge";

const productKinds = [
  {
    kind: "async_direct_edit",
    label: "대면 슈퍼비전 (현장 지도 및 교정)",
    desc: "직접 만나 지도를 진행하거나 서류를 상세 교정합니다.",
    defaultPrice: 150000
  },
  {
    kind: "zoom_60",
    label: "비대면 화상 슈퍼비전 (60분)",
    desc: "화상 회의로 1시간 동안 1:1 슈퍼비전을 진행합니다.",
    defaultPrice: 80000
  },
  {
    kind: "zoom_90",
    label: "비대면 화상 슈퍼비전 (90분)",
    desc: "화상 회의로 1시간 30분 동안 심층 슈퍼비전을 진행합니다.",
    defaultPrice: 120000
  },
  {
    kind: "async_comment",
    label: "서면 피드백 슈퍼비전 (2회 무료 피드백)",
    desc: "사례 자료를 바탕으로 서면 코멘트와 피드백을 전달합니다.",
    defaultPrice: 50000
  },
  {
    kind: "urgent_24h",
    label: "24시간 이내 긴급 슈퍼비전",
    desc: "요청 접수 후 24시간 이내에 긴급 지도를 진행합니다.",
    defaultPrice: 200000
  }
] as const;

export function SupervisorProfileEditor({
  profile,
  qualifications,
  specialties,
  initialProducts
}: {
  profile: profiles.SupervisorProfile | null;
  qualifications: profiles.Qualification[];
  specialties: profiles.Specialty[];
  initialProducts: profiles.Product[];
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">(
    profile?.yearsOfExperience ?? ""
  );

  const [checkedProducts, setCheckedProducts] = useState<Record<string, boolean>>(
    () => {
      const states: Record<string, boolean> = {};
      for (const item of productKinds) {
        states[item.kind] = initialProducts.some(
          (p) => p.kind === item.kind && p.active
        );
      }
      return states;
    }
  );

  const [productPrices, setProductPrices] = useState<Record<string, number>>(() => {
    const prices: Record<string, number> = {};
    for (const item of productKinds) {
      const match = initialProducts.find((p) => p.kind === item.kind);
      prices[item.kind] = match ? match.priceKrw : item.defaultPrice;
    }
    return prices;
  });

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const approvedQualifications = qualifications.filter((q) => q.status === "approved");

  const previewProducts = productKinds
    .filter((k) => checkedProducts[k.kind])
    .map((k) => ({
      id: k.kind,
      kind: k.kind,
      title: k.label,
      priceKrw: productPrices[k.kind] ?? k.defaultPrice,
      active: true
    }));

  function handleProductCheck(kind: string, checked: boolean) {
    setCheckedProducts((prev) => ({ ...prev, [kind]: checked }));
  }

  function handleProductPrice(kind: string, price: number) {
    setProductPrices((prev) => ({ ...prev, [kind]: Math.max(0, price) }));
  }

  function handleSave() {
    if (!displayName.trim()) {
      toast.error("공개 표시명을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      setMessage("프로필을 저장하는 중입니다...");

      let profileResponse: Response;

      try {
        profileResponse = await fetch("/api/me/supervisor-profile", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            displayName: displayName.trim(),
            photoUrl: photoUrl.trim() || null,
            headline: headline.trim() || null,
            bio: bio.trim() || null,
            yearsOfExperience: yearsOfExperience === "" ? null : yearsOfExperience
          })
        });
      } catch {
        const errMsg = supervisorSettingsErrorMessage("server_unavailable");
        setMessage(errMsg);
        toast.error(errMsg);
        return;
      }

      if (!profileResponse.ok) {
        const errBody = await safeJson(profileResponse);
        const errMsg = supervisorSettingsErrorMessage(
          errBody.error?.code,
          "프로필을 저장하지 못했습니다."
        );
        setMessage(errMsg);
        toast.error(errMsg);
        return;
      }

      setMessage("슈퍼비전 방식을 저장하는 중입니다...");
      const promises = productKinds.map(async (item) => {
        const isChecked = checkedProducts[item.kind] ?? false;
        const price = productPrices[item.kind] ?? item.defaultPrice;

        return fetch("/api/me/products", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: item.kind,
            title: item.label,
            description: item.desc,
            priceKrw: price,
            active: isChecked,
            turnaroundHours: item.kind === "urgent_24h" ? 24 : null
          })
        });
      });

      let responses: Response[];
      try {
        responses = await Promise.all(promises);
      } catch {
        const errMsg = supervisorSettingsErrorMessage("server_unavailable");
        setMessage(errMsg);
        toast.error(errMsg);
        return;
      }

      const failed = responses.find((response) => !response.ok);

      if (failed) {
        const errBody = await safeJson(failed);
        const errMsg = supervisorSettingsErrorMessage(
          errBody.error?.code,
          "슈퍼비전 방식을 저장하지 못했습니다."
        );
        setMessage(errMsg);
        toast.error(errMsg);
        return;
      }

      setMessage("프로필과 슈퍼비전 방식을 저장했습니다.");
      toast.success("프로필과 슈퍼비전 방식을 저장했습니다.");
    });
  }

  return (
    <div className="grid gap-6">
      <div className="space-y-6">
        <section className="rounded-xl border border-line bg-surface-elevated p-6">
          <div className="mb-6 border-b border-line pb-4">
            <div>
              <p className="text-sm font-semibold text-brand-700">공개 프로필</p>
              <h2 className="mt-1 text-2xl font-bold text-ink-900">
                선택에 필요한 정보만 정리합니다
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                공개 프로필과 슈퍼비전 방식을 한 화면에서 정리합니다.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Field>
              <Label
                htmlFor="displayName"
                className="text-sm font-semibold text-ink-900"
              >
                공개 표시명 (실명 또는 성함) *
              </Label>
              <Input
                value={displayName}
                id="displayName"
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="예: 박건휘 교수"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="headline" className="text-sm font-semibold text-ink-900">
                검색 화면 한줄 소개 (헤드라인)
              </Label>
              <Input
                value={headline}
                id="headline"
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="예: 종합심리평가 보고서 피드백을 차분히 돕습니다"
              />
            </Field>

            <Field>
              <Label htmlFor="photoUrl" className="text-sm font-semibold text-ink-900">
                사진 주소 (URL)
              </Label>
              <Input
                value={photoUrl}
                id="photoUrl"
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="프로필 사진 URL을 입력해주세요."
                type="url"
              />
            </Field>

            <Field>
              <Label htmlFor="bio" className="text-sm font-semibold text-ink-900">
                상세 프로필 소개
              </Label>
              <Textarea
                value={bio}
                id="bio"
                onChange={(e) => setBio(e.target.value)}
                placeholder="신청자가 확인해야 할 학술 배경, 전문 분야, 슈퍼비전 방식, 지도 이력을 간결하게 작성해 주세요."
                rows={6}
              />
            </Field>

            <Field>
              <Label
                htmlFor="yearsOfExperience"
                className="text-sm font-semibold text-ink-900"
              >
                실무 경력 연수
              </Label>
              <Input
                value={yearsOfExperience}
                id="yearsOfExperience"
                min={0}
                onChange={(e) =>
                  setYearsOfExperience(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="예: 15"
                type="number"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface-elevated p-6">
          <div className="mb-5 border-b border-line pb-4">
            <p className="text-sm font-semibold text-brand-700">슈퍼비전 방식</p>
            <h3 className="mt-1 text-xl font-bold text-ink-900">
              공개할 세션 유형과 요금
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              신청자가 선택할 수 있는 슈퍼비전 방식과 기본 요금을 정합니다.
            </p>
          </div>

          <div className="space-y-4">
            {productKinds.map((item) => {
              const isChecked = checkedProducts[item.kind] ?? false;
              const price = productPrices[item.kind] ?? item.defaultPrice;

              return (
                <div
                  className={`group rounded-xl border p-4 transition-colors ${
                    isChecked
                      ? "border-brand-300 bg-brand-50/40"
                      : "border-line bg-surface-base hover:border-brand-200"
                  }`}
                  key={item.kind}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <label className="flex flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleProductCheck(item.kind, e.target.checked)
                        }
                        className="mt-1 shrink-0"
                      />
                      <div>
                        <strong className="block text-sm text-ink-900">
                          {item.label}
                        </strong>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">
                          {item.desc}
                        </p>
                      </div>
                    </label>

                    {isChecked && (
                      <div className="mt-1 flex items-center gap-2 sm:mt-0">
                        <span className="font-mono text-xs text-ink-500">₩</span>
                        <input
                          type="number"
                          value={price}
                          min={0}
                          step={10000}
                          onChange={(e) =>
                            handleProductPrice(item.kind, Number(e.target.value))
                          }
                          className="h-9 w-28 rounded-md border border-line bg-surface-elevated px-2 text-right font-mono text-xs font-bold text-ink-900 focus:border-brand-400 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4">
            <Button
              className="flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
              disabled={isPending}
              onClick={handleSave}
              type="button"
            >
              <Save aria-hidden size={16} />
              {isPending ? "저장 중..." : "프로필과 슈퍼비전 방식 저장"}
            </Button>
            {message ? (
              <p className="text-sm font-semibold text-brand-700">{message}</p>
            ) : null}
          </div>
        </section>
      </div>

      <details className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
        <summary className="cursor-pointer list-none p-5 text-sm font-bold text-ink-900">
          공개 화면 미리보기
        </summary>
        <div className="grid gap-5 border-t border-line p-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 grid size-24 place-items-center overflow-hidden rounded-full border border-line bg-brand-50 text-brand-600">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="실시간 미리보기 사진"
                  className="h-full w-full object-cover"
                  src={photoUrl}
                />
              ) : (
                <UserRoundCog aria-hidden size={36} />
              )}
            </div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              {displayName || "표시명을 입력해주세요"}
              {profile?.verificationStatus === "approved" && (
                <CheckCircle2 aria-hidden className="text-brand-600" size={18} />
              )}
            </h2>
            <p className="mt-1 text-xs font-medium text-ink-500">
              {headline || "한 줄 소개가 들어갑니다."}
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap gap-1">
              <Badge tone={profile?.visibility === "public" ? "brand" : "neutral"}>
                {profile?.visibility === "public" ? "검색 공개됨" : "검색 비공개"}
              </Badge>
              <Badge tone="accent">
                실무{" "}
                {yearsOfExperience ? `${String(yearsOfExperience)}년` : "경력 미지정"}
              </Badge>
              {approvedQualifications.length > 0 ? (
                approvedQualifications.slice(0, 2).map((q) => (
                  <Badge key={q.id} tone="brand" className="py-0 text-[10px]">
                    {q.name}
                  </Badge>
                ))
              ) : (
                <Badge tone="neutral" className="py-0 text-[10px]">
                  인증된 자격 증빙
                </Badge>
              )}
              {specialties.length > 0 ? (
                specialties.slice(0, 3).map((s) => (
                  <Badge key={s.id} tone="neutral" className="py-0 text-[10px]">
                    {s.labelKo}
                  </Badge>
                ))
              ) : (
                <Badge tone="neutral" className="py-0 text-[10px]">
                  전문분야 미지정
                </Badge>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-ink-500">소개글</h4>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {bio ||
                  "상세 소개글을 입력하면 신청자가 확인할 요약 문구가 이곳에 반영됩니다."}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-ink-500">
                슈퍼비전 방식 ({String(previewProducts.length)}개 선택됨)
              </h4>
              {previewProducts.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-line bg-surface-base p-3 text-sm text-ink-500">
                  공개할 슈퍼비전 방식을 하나 이상 선택하면 표시됩니다.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-line rounded-lg border border-line">
                  {previewProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-semibold text-ink-900">
                        {prod.title}
                      </span>
                      <span className="shrink-0 font-mono font-bold text-brand-700">
                        ₩ {prod.priceKrw.toLocaleString("ko-KR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
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
          검색 공개는 승인된 자격과 계정 확인이 완료된 뒤 가능합니다.
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

function visibilityError(code: string | undefined, fallback?: string): string {
  const labels: Record<string, string> = {
    "2fa_required": "검색 공개 전환 전에 계정 확인을 완료해주세요.",
    forbidden: "슈퍼바이저 계정에서만 공개 상태를 바꿀 수 있습니다.",
    invalid_request: "공개 상태 값을 다시 확인해주세요.",
    not_found: "먼저 프로필을 저장해주세요.",
    unauthorized: "로그인이 필요합니다.",
    verification_required: "승인된 자격 정보가 있어야 검색 공개로 전환할 수 있습니다."
  };
  return labels[code ?? ""] ?? fallback ?? "공개 상태 변경에 실패했습니다.";
}

async function safeJson(response: Response): Promise<{ error?: { code?: string } }> {
  try {
    return (await response.json()) as { error?: { code?: string } };
  } catch {
    return {};
  }
}

function supervisorSettingsErrorMessage(
  code: string | undefined,
  fallback = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
): string {
  const labels: Record<string, string> = {
    forbidden: "슈퍼바이저 계정에서만 관리할 수 있습니다.",
    invalid_request: "입력한 내용을 다시 확인해주세요.",
    profile_required: "먼저 공개 프로필을 저장해주세요.",
    server_unavailable:
      "일시적인 문제로 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? fallback;
}
