import { profiles } from "@csp/db";
import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { SiteHeader } from "../../../components/clinicflow-shell";
import { createRuntimeDatabase } from "../../../lib/auth/database";

type SearchParams = {
  keyword?: string;
  sort?: "average_rating" | "avg_response_minutes" | "total_completed";
};

type PublicSupervisor = Awaited<ReturnType<typeof profiles.searchSupervisors>>[number];

type SupervisorProduct = {
  id: string;
  title: string;
  priceKrw: number;
  turnaroundHours: number | null;
};

type SupervisorWithQualifications = PublicSupervisor & {
  qualifications?: Array<{ name: string }>;
};

export const dynamic = "force-dynamic";

export default async function SupervisorsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const keyword = (params.keyword ?? "").trim();
  const sort = params.sort ?? "average_rating";
  const result = await loadSupervisors({ keyword, sort });

  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader active="supervisors" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-10 lg:px-8">
        <section className="grid gap-5">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            슈퍼바이저 찾기
          </span>
          <div className="grid gap-4">
            <h1 className="max-w-5xl break-keep text-[3.1rem] font-bold leading-[0.98] tracking-normal text-[#081225] md:text-[4.75rem]">
              슈퍼바이저를 비교하고 선택하세요
            </h1>
            <p className="max-w-3xl break-keep text-lg leading-9 text-[#5f6c8f]">
              사진, 자격, 전문분야, 자기소개를 함께 보고 지금 사례에 맞는 슈퍼바이저를
              고릅니다.
            </p>
          </div>
        </section>

        <form
          action="/supervisors"
          className="grid gap-4 rounded-[18px] border border-[#e7ebf1] bg-white p-4 shadow-[0_22px_48px_rgba(8,18,37,0.06)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
        >
          <label className="grid gap-2 rounded-[18px] bg-[#f8faff] px-5 py-4">
            <span className="text-sm font-semibold text-[#8b94ad]">검색</span>
            <input
              className="w-full border-0 bg-transparent p-0 text-lg font-semibold text-[#081225] placeholder:text-[#5f6c8f] focus:outline-none"
              defaultValue={keyword}
              name="keyword"
              placeholder="성인 평가, 아동, 위기 사례"
            />
          </label>
          <label className="grid gap-2 rounded-[18px] bg-[#f8faff] px-5 py-4">
            <span className="text-sm font-semibold text-[#8b94ad]">정렬 기준</span>
            <select
              className="border-0 bg-transparent p-0 text-lg font-semibold text-[#081225] focus:outline-none"
              defaultValue={sort}
              name="sort"
            >
              <option value="average_rating">평가 높은 순</option>
              <option value="avg_response_minutes">응답 빠른 순</option>
              <option value="total_completed">완료 많은 순</option>
            </select>
          </label>
          <div className="grid gap-2 rounded-[18px] bg-[#f8faff] px-5 py-4">
            <span className="text-sm font-semibold text-[#8b94ad]">선택 기준</span>
            <p className="text-lg font-semibold text-[#081225]">
              자격 · 전문분야 · 소개
            </p>
          </div>
          <Button
            className="h-[70px] rounded-[20px] bg-[#2563ff] px-7 text-base font-semibold text-white hover:bg-[#1f58e6]"
            type="submit"
          >
            슈퍼바이저 찾기
          </Button>
        </form>

        {result.error ? (
          <section className="rounded-[18px] border border-[#e7ebf1] bg-white px-6 py-8">
            <h2 className="text-2xl font-bold text-[#081225]">
              슈퍼바이저 목록을 불러오지 못했습니다
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[#5f6c8f]">
              잠시 후 다시 시도해 주세요. 계속되면 관리자에게 현재 검색 조건을 함께
              알려주세요.
            </p>
          </section>
        ) : result.supervisors.length === 0 ? (
          <section className="rounded-[18px] border border-[#e7ebf1] bg-white px-6 py-8">
            <h2 className="text-2xl font-bold text-[#081225]">
              조건에 맞는 슈퍼바이저가 없습니다
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[#5f6c8f]">
              검색어를 줄이거나, 사례 특징이 드러나는 다른 표현으로 다시 확인해보세요.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {result.supervisors.map((supervisor) => (
              <SupervisorCard key={supervisor.id} supervisor={supervisor} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

async function loadSupervisors(input: {
  keyword: string;
  sort: "average_rating" | "avg_response_minutes" | "total_completed";
}): Promise<{ supervisors: SupervisorWithQualifications[]; error: boolean }> {
  try {
    const db = createRuntimeDatabase();
    const supervisors = await profiles.searchSupervisors(db, {
      availability: null,
      keyword: input.keyword || null,
      limit: 12,
      offset: 0,
      priceMax: null,
      priceMin: null,
      qualification: null,
      sort: input.sort,
      specialtyCodes: []
    });
    const detailed = await Promise.all(
      supervisors.map(async (supervisor) => {
        const detail = await profiles.getPublicSupervisorDetails(db, supervisor.id);
        return detail ?? supervisor;
      })
    );
    return { supervisors: detailed, error: false };
  } catch {
    return { supervisors: [], error: true };
  }
}

function SupervisorCard({ supervisor }: { supervisor: SupervisorWithQualifications }) {
  const products = normalizeProducts(supervisor.serviceProducts);
  const primaryProduct = products[0];
  const qualification = supervisor.qualifications?.[0]?.name ?? "승인된 슈퍼바이저";
  const specialties =
    supervisor.specialties.slice(0, 3).join(", ") || "프로필 상세에서 확인";

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#e7ebf1] bg-white shadow-[0_18px_40px_rgba(8,18,37,0.06)]">
      <div className="h-72 overflow-hidden bg-[#eef3ff]">
        {supervisor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${supervisor.displayName} 슈퍼바이저 사진`}
            className="h-full w-full object-cover"
            src={supervisor.photoUrl}
          />
        ) : (
          <div className="grid h-full place-items-center text-6xl font-bold text-[#2563ff]">
            {supervisor.displayName.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="grid gap-5 px-6 py-7">
        <div className="grid gap-3">
          <h2 className="text-[2rem] font-bold tracking-normal text-[#081225]">
            {supervisor.displayName}
          </h2>
          <div className="grid gap-4 text-base leading-8 text-[#5f6c8f]">
            <InfoLine label="자격" value={qualification} />
            <InfoLine label="전문분야" value={specialties} />
            <InfoLine
              label="자기소개"
              value={
                supervisor.bio ??
                "자료 검토 흐름과 피드백 방식을 프로필에서 확인할 수 있습니다."
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {primaryProduct ? (
            <Badge className="rounded-full bg-[#eef3ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
              {formatKrw(primaryProduct.priceKrw)}
            </Badge>
          ) : (
            <span className="text-sm font-semibold text-[#8b94ad]">
              세션 정보는 상세에서 확인
            </span>
          )}
          <Button
            asChild
            className="h-11 rounded-[14px] border border-[#e7ebf1] bg-white px-4 text-sm font-semibold text-[#081225] hover:bg-[#f8faff]"
            variant="secondary"
          >
            <Link href={`/supervisors/${supervisor.id}`}>프로필 보기</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-sm font-semibold text-[#8b94ad]">{label}</p>
      <p className="break-keep text-base font-medium text-[#43506f]">{value}</p>
    </div>
  );
}

function normalizeProducts(value: unknown): SupervisorProduct[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSupervisorProduct);
}

function isSupervisorProduct(value: unknown): value is SupervisorProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return (
    typeof product["id"] === "string" &&
    typeof product["title"] === "string" &&
    typeof product["priceKrw"] === "number"
  );
}

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}
