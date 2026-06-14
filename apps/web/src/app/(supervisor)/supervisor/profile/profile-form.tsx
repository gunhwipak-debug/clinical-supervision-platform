"use client";

import type { profiles } from "@csp/db";
import { CheckCircle2, Eye, EyeOff, Save, UserRoundCog, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";

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
    desc: "내장 화상 및 줌 회의로 1시간 동안 1:1 세션을 지도합니다.",
    defaultPrice: 80000
  },
  {
    kind: "zoom_90",
    label: "비대면 화상 슈퍼비전 (90분)",
    desc: "내장 화상 및 줌 회의로 1시간 30분 동안 심층 세션을 지도합니다.",
    defaultPrice: 120000
  },
  {
    kind: "async_comment",
    label: "서면 피드백 슈퍼비전 (2회 무료 피드백)",
    desc: "자료 제출 시 서면 코멘트 및 피드백을 전달합니다.",
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

      const profileResponse = await fetch("/api/me/supervisor-profile", {
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

      if (!profileResponse.ok) {
        const errBody = (await profileResponse.json()) as { error?: { code: string } };
        const errMsg = errBody.error?.code ?? "프로필 저장 실패";
        setMessage(errMsg);
        toast.error(errMsg);
        return;
      }

      setMessage("제공 항목을 저장하는 중입니다...");
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

      await Promise.all(promises);
      setMessage("프로필과 제공 항목을 저장했습니다.");
      toast.success("프로필과 제공 항목을 저장했습니다.");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
      <div className="space-y-lg lg:col-span-7">
        <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-card">
          <div className="mb-6 flex items-start justify-between border-b border-outline-variant/60 pb-xs">
            <div>
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                슈퍼바이저 전용 프로필 설정
              </span>
              <h2 className="mt-xs font-display-md text-xl font-bold text-on-surface">
                공개 슈퍼바이저 프로필 작성
              </h2>
              <p className="mt-xs font-body-sm text-xs text-on-surface-variant">
                슈퍼바이저가 공개 프로필과 제공 항목을 한 화면에서 정리할 수 있도록
                구성했습니다.
              </p>
            </div>
          </div>

          <div className="grid gap-md">
            <Field>
              <Label
                htmlFor="displayName"
                className="font-bold text-on-surface text-sm"
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
              <Label htmlFor="headline" className="font-bold text-on-surface text-sm">
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
              <Label htmlFor="photoUrl" className="font-bold text-on-surface text-sm">
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
              <Label htmlFor="bio" className="font-bold text-on-surface text-sm">
                상세 프로필 소개
              </Label>
              <Textarea
                value={bio}
                id="bio"
                onChange={(e) => setBio(e.target.value)}
                placeholder="슈퍼바이지가 확인해야 할 학술 배경, 전문 분야, 슈퍼비전 방식, 지도 이력을 간결하게 작성해 주세요."
                rows={6}
              />
            </Field>

            <Field>
              <Label
                htmlFor="yearsOfExperience"
                className="font-bold text-on-surface text-sm"
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
        </div>

        <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-card">
          <div className="mb-5 border-b border-outline-variant/60 pb-xs">
            <span className="inline-flex rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
              제공할 슈퍼비전 항목
            </span>
            <h3 className="mt-xs font-title-lg text-base font-bold text-on-surface">
              공개할 지도 방식과 요금
            </h3>
            <p className="mt-xs font-body-sm text-xs text-on-surface-variant">
              슈퍼바이지가 선택할 수 있는 지도 방식과 기본 요금을 정합니다.
            </p>
          </div>

          <div className="space-y-md">
            {productKinds.map((item) => {
              const isChecked = checkedProducts[item.kind] ?? false;
              const price = productPrices[item.kind] ?? item.defaultPrice;

              return (
                <div
                  className={`group rounded-xl border p-md transition-all duration-200 ${
                    isChecked
                      ? "border-secondary/60 bg-secondary/2 shadow-xs"
                      : "border-outline-variant/60 bg-surface/30 hover:border-secondary/30"
                  }`}
                  key={item.kind}
                >
                  <div className="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
                    <label className="flex cursor-pointer gap-sm items-start flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleProductCheck(item.kind, e.target.checked)
                        }
                        className="mt-1 custom-checkbox shrink-0"
                      />
                      <div>
                        <strong className="block text-sm text-on-surface group-hover:text-secondary transition-colors">
                          {item.label}
                        </strong>
                        <p className="mt-xs text-[11px] text-on-surface-variant leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </label>

                    {isChecked && (
                      <div className="flex items-center gap-xs mt-xs sm:mt-0">
                        <span className="font-mono text-xs text-on-surface-variant">
                          ₩
                        </span>
                        <input
                          type="number"
                          value={price}
                          min={0}
                          step={10000}
                          onChange={(e) =>
                            handleProductPrice(item.kind, Number(e.target.value))
                          }
                          className="w-28 h-9 rounded-md border border-outline-variant bg-surface px-2 text-right font-mono text-xs font-bold text-secondary focus:border-secondary focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-sm items-start rounded-xl border border-outline-variant bg-surface-container/30 p-md">
          <Button
            className="flex h-11 w-full items-center justify-center gap-xs font-label-md text-sm font-bold active:scale-98"
            disabled={isPending}
            onClick={handleSave}
            type="button"
          >
            <Save aria-hidden size={16} />
            {isPending ? "저장 중..." : "프로필과 제공 항목 저장"}
          </Button>
          {message ? (
            <p className="font-label-sm text-xs font-bold text-secondary animate-pulse mt-xs">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-[104px] space-y-md">
          <div className="rounded-xl border border-secondary/20 bg-secondary/3 p-md shadow-2xs">
            <span className="flex items-center gap-xs font-label-sm text-xs font-bold text-secondary">
              <Sparkles size={14} />
              실시간 공개 화면 미리보기
            </span>
            <p className="mt-xs text-[11px] text-on-surface-variant leading-relaxed">
              입력한 내용이 슈퍼바이지에게 보이는 공개 프로필에 어떻게 배치되는지
              확인합니다.
            </p>
          </div>

          <Card className="rounded-xl border-line bg-surface-elevated p-6 shadow-card">
            <div className="flex flex-col items-center text-center">
              <div className="mb-md grid size-24 place-items-center overflow-hidden rounded-full border border-line bg-brand-50 text-brand-600">
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
              <h2 className="text-xl font-extrabold text-primary flex items-center gap-xs">
                {displayName || "표시명을 입력해주세요"}
                {profile?.verificationStatus === "approved" && (
                  <CheckCircle2 aria-hidden className="text-brand-600" size={18} />
                )}
              </h2>
              <p className="mt-xs text-xs font-medium text-on-surface-variant min-h-[16px]">
                {headline || "소개 카드의 한 줄 소개가 들어갑니다."}
              </p>

              <div className="mt-xs flex flex-wrap justify-center gap-1">
                <Badge tone={profile?.visibility === "public" ? "brand" : "neutral"}>
                  {profile?.visibility === "public" ? "검색 공개됨" : "비공개 초안"}
                </Badge>
                <Badge tone="accent">
                  실무{" "}
                  {yearsOfExperience ? `${String(yearsOfExperience)}년` : "경력 미지정"}
                </Badge>
              </div>

              {/* 자격 및 전문 분야 배지 미리보기 */}
              <div className="mt-md flex flex-wrap justify-center gap-1 border-t border-outline-variant/40 pt-md w-full">
                {approvedQualifications.length > 0 ? (
                  approvedQualifications.slice(0, 2).map((q) => (
                    <Badge key={q.id} tone="brand" className="text-[10px] py-0">
                      {q.name}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="neutral" className="text-[10px] py-0">
                    인증된 자격 증빙
                  </Badge>
                )}
                {specialties.length > 0 ? (
                  specialties.slice(0, 3).map((s) => (
                    <Badge key={s.id} tone="neutral" className="text-[10px] py-0">
                      {s.labelKo}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="neutral" className="text-[10px] py-0">
                    전문분야 미지정
                  </Badge>
                )}
              </div>

              <div className="mt-md w-full text-left">
                <h4 className="font-label-sm text-xs font-bold text-on-surface border-b border-outline-variant/40 pb-xs mb-xs">
                  소개 소개글 미리보기
                </h4>
                <p className="line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-on-surface-variant min-h-[50px]">
                  {bio ||
                    "좌측에 상세 소개글을 입력하시면 이곳에 최대 4줄까지 카드 요약으로 자동 반영됩니다."}
                </p>
              </div>

              <div className="mt-md w-full text-left">
                <h4 className="font-label-sm text-xs font-bold text-on-surface border-b border-outline-variant/40 pb-xs mb-sm">
                  제공 항목 ({String(previewProducts.length)}개 선택됨)
                </h4>
                {previewProducts.length === 0 ? (
                  <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest text-center text-[10px] text-on-surface-variant">
                    공개할 제공 항목을 하나 이상 선택하면 이곳에 표시됩니다.
                  </div>
                ) : (
                  <div className="space-y-xs max-h-40 overflow-y-auto pr-xs">
                    {previewProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between rounded-lg border border-outline-variant/60 bg-surface px-sm py-1.5"
                      >
                        <span className="text-[10px] font-bold text-on-surface truncate max-w-[200px]">
                          {prod.title}
                        </span>
                        <span className="font-mono text-[10px] font-extrabold text-secondary shrink-0">
                          ₩ {prod.priceKrw.toLocaleString("ko-KR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
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
