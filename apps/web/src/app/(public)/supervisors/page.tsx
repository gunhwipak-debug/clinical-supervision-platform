/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { profiles } from "@csp/db";
import { Star } from "lucide-react";
import { SiteHeader } from "../../../components/clinicflow-shell";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { isSupervisor } from "../../../lib/auth/guards";

type ProductSummary = {
  id: string;
  title: string;
  priceKrw: number;
  turnaroundHours: number | null;
};

type AvailabilityFilter = "this_week" | "this_month";
type SearchSort = "avg_response_minutes" | "average_rating" | "total_completed";

type SearchParams = {
  availability?: string;
  keyword?: string;
  page?: string;
  priceMax?: string;
  priceMin?: string;
  q?: string;
  qualification?: string;
  sort?: string;
  specialty?: string;
};

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const current = await getCurrentUser();
  const params = await searchParams;
  const keyword = params.keyword?.trim() || params.q?.trim() || null;
  const specialty = params.specialty?.trim() || "";
  const qualification = params.qualification?.trim() || "";
  const availability = parseAvailability(params.availability);
  const priceMin = parseNonNegativeInt(params.priceMin);
  const priceMax = parseNonNegativeInt(params.priceMax);
  const sort = parseSort(params.sort);
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;
  const db = createRuntimeDatabase();
  const [specialties, supervisorResults] = await Promise.all([
    profiles.listSpecialtyCatalog(db),
    profiles.searchSupervisors(db, {
      availability,
      keyword,
      qualification: qualification || null,
      specialtyCodes: specialty ? [specialty] : [],
      priceMin,
      priceMax,
      limit: pageSize + 1,
      offset,
      sort
    })
  ]);
  const hasNextPage = supervisorResults.length > pageSize;
  const supervisors = supervisorResults.slice(0, pageSize);
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader active="supervisors" actionHref="/supervisors" actionLabel="비교하기" />

      <main className="mx-auto w-full max-w-container-max flex-grow px-margin-mobile py-xl md:px-gutter">
        <section className="mb-xl">
          <div className="flex flex-col gap-md md:flex-row md:items-end md:justify-between mb-lg">
            <div>
              <h1 className="mb-xs font-display-lg text-display-lg tracking-tight text-on-surface">
                슈퍼바이저 찾기
              </h1>
              <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
                사진, 자격, 전문 분야, 소개를 한 번에 비교하고 내 사례에 맞는
                슈퍼바이저를 선택합니다.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <div className="grid gap-lg lg:grid-cols-[1fr_300px]">
              <div className="grid gap-md">
                <div>
                  <span className="inline-flex rounded-md bg-secondary/10 px-2.5 py-1 font-label-sm text-xs font-bold text-secondary">
                    선택 기준
                  </span>
                  <h2 className="mt-xs font-headline-md text-headline-md text-on-surface">
                    이름보다 먼저, 내 사례에 맞는 근거를 확인하세요.
                  </h2>
                  <p className="mt-xs max-w-2xl font-body-md text-sm leading-relaxed text-on-surface-variant">
                    ClinicFlow의 슈퍼바이저 목록은 구매 항목을 고르는 화면이 아니라,
                    교육과 검토를 맡길 사람을 비교하는 인명록입니다.
                  </p>
                </div>

                <div className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["photo_camera", "사진", "실제 프로필과 공개 이름을 확인합니다."],
                    ["workspace_premium", "자격", "검증된 자격과 공개 이력을 봅니다."],
                    [
                      "psychology",
                      "전문 분야",
                      "평가, 상담, 보고서 등 적합도를 비교합니다."
                    ],
                    ["notes", "소개", "슈퍼비전 방식과 설명 톤을 확인합니다."]
                  ].map(([icon, title, body]) => (
                    <div
                      className="rounded-lg border border-outline-variant bg-surface p-md"
                      key={title}
                    >
                      <span className="material-symbols-outlined text-[22px] text-secondary">
                        {icon}
                      </span>
                      <h3 className="mt-sm font-title-sm text-sm font-bold text-on-surface">
                        {title}
                      </h3>
                      <p className="mt-xs font-body-sm text-xs leading-relaxed text-on-surface-variant">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface p-md">
                {current ? (
                  !isSupervisor(current) ? (
                    <div>
                      <h3 className="font-title-md text-base font-bold text-on-surface">
                        다음 단계
                      </h3>
                      <p className="mt-base font-body-sm text-xs leading-relaxed text-on-surface-variant">
                        맞는 슈퍼바이저를 찾았다면 세션 유형과 가능 일정을 확인한 뒤
                        의뢰 초안을 만듭니다.
                      </p>
                      <Link
                        className="mt-lg flex w-full justify-center rounded-lg bg-primary px-md py-2.5 font-label-md text-xs font-bold text-on-primary transition-all hover:bg-opacity-90"
                        href="/supervisors"
                      >
                        목록에서 선택하기
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-title-md text-base font-bold text-on-surface">
                        슈퍼바이저 업무
                      </h3>
                      <p className="mt-base font-body-sm text-xs leading-relaxed text-on-surface-variant">
                        받은 요청과 프로필 공개 상태는 업무 화면에서 관리합니다.
                      </p>
                      <Link
                        className="mt-lg flex w-full justify-center rounded-lg bg-secondary px-md py-2.5 font-label-md text-xs font-bold text-on-primary transition-all hover:bg-opacity-90"
                        href="/supervisor"
                      >
                        업무 화면으로 이동
                      </Link>
                    </div>
                  )
                ) : (
                  <div>
                    <h3 className="font-title-md text-base font-bold text-on-surface">
                      처음 이용한다면
                    </h3>
                    <p className="mt-base font-body-sm text-xs leading-relaxed text-on-surface-variant">
                      슈퍼바이저를 먼저 둘러본 뒤, 의뢰 단계에서 계정을 만들 수
                      있습니다.
                    </p>
                    <Link
                      className="mt-lg flex w-full justify-center rounded-lg bg-primary px-md py-2.5 font-label-md text-xs font-bold text-on-primary transition-all hover:bg-opacity-90"
                      href="/signup"
                    >
                      계정 만들기
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <form
          action="/supervisors"
          className="relative z-10 mb-xl flex w-full flex-col items-stretch gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-sm shadow-sm md:flex-row md:items-center md:p-md"
        >
          <div className="relative w-full md:flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full h-11 rounded-lg border border-outline-variant bg-surface pl-10 pr-sm font-body-md text-sm text-on-surface transition-all placeholder:text-on-tertiary-container focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              defaultValue={keyword ?? ""}
              name="keyword"
              placeholder="이름, 전문 분야 또는 자격증 검색"
              type="text"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-sm md:w-auto md:flex-nowrap">
            <select
              className="flex-1 h-11 cursor-pointer rounded-lg border border-outline-variant bg-surface pl-sm pr-8 font-label-md text-sm text-on-surface focus:border-secondary focus:outline-none md:w-44 select-custom-arrow"
              defaultValue={qualification}
              name="qualification"
            >
              <option value="">자격 전체</option>
              <option value="임상심리전문가">임상심리전문가</option>
              <option value="정신건강임상심리사">정신건강임상심리사</option>
              <option value="신경심리전문가">신경심리전문가</option>
            </select>
            <select
              className="flex-1 h-11 cursor-pointer rounded-lg border border-outline-variant bg-surface pl-sm pr-8 font-label-md text-sm text-on-surface focus:border-secondary focus:outline-none md:w-44 select-custom-arrow"
              defaultValue={specialty}
              name="specialty"
            >
              <option value="">전문 분야 전체</option>
              {specialties.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.labelKo}
                </option>
              ))}
            </select>
            <select
              className="flex-1 h-11 cursor-pointer rounded-lg border border-outline-variant bg-surface pl-sm pr-8 font-label-md text-sm text-on-surface focus:border-secondary focus:outline-none md:w-38 select-custom-arrow"
              defaultValue={availability ?? ""}
              name="availability"
            >
              <option value="">가능 일정 전체</option>
              <option value="this_week">이번 주 가능</option>
              <option value="this_month">이번 달 가능</option>
            </select>
            <input
              className="min-w-0 flex-1 h-11 rounded-lg border border-outline-variant bg-surface px-sm font-label-md text-sm text-on-surface placeholder:text-on-tertiary-container focus:border-secondary focus:outline-none md:w-32"
              defaultValue={priceMin ?? ""}
              inputMode="numeric"
              min={0}
              name="priceMin"
              placeholder="최소 요금"
              type="number"
            />
            <input
              className="min-w-0 flex-1 h-11 rounded-lg border border-outline-variant bg-surface px-sm font-label-md text-sm text-on-surface placeholder:text-on-tertiary-container focus:border-secondary focus:outline-none md:w-32"
              defaultValue={priceMax ?? ""}
              inputMode="numeric"
              min={0}
              name="priceMax"
              placeholder="최대 요금"
              type="number"
            />
            <select
              className="flex-1 h-11 cursor-pointer rounded-lg border border-outline-variant bg-surface pl-sm pr-8 font-label-md text-sm text-on-surface focus:border-secondary focus:outline-none md:w-38 select-custom-arrow"
              defaultValue={sort}
              name="sort"
            >
              <option value="average_rating">평점 높은 순</option>
              <option value="avg_response_minutes">응답 빠른 순</option>
              <option value="total_completed">진행 많은 순</option>
            </select>
            <button
              className="rounded-lg h-11 bg-primary px-md font-label-md text-sm font-bold text-on-primary transition-all hover:bg-opacity-90 active:opacity-80"
              type="submit"
            >
              검색
            </button>
          </div>
        </form>

        {supervisors.length === 0 ? (
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              조건에 맞는 슈퍼바이저가 없습니다
            </h2>
            <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
              검색어를 줄이거나 전체 목록으로 다시 확인해주세요.
            </p>
            <Link
              className="mt-md inline-flex rounded-lg border border-outline-variant px-md py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container"
              href="/supervisors"
            >
              전체 보기
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-3">
            {supervisors.map((supervisor) => (
              <SupervisorCard key={supervisor.id} supervisor={supervisor} />
            ))}
          </section>
        )}

        {supervisors.length > 0 ? (
          <div className="mt-xl flex justify-center gap-sm" aria-label="검색 결과 페이지">
            {page > 1 ? (
              <Link
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                href={
                  supervisorsPageHref({
                    availability,
                    keyword,
                    page: page - 1,
                    priceMax,
                    priceMin,
                    qualification,
                    sort,
                    specialty
                  }) as never
                }
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </Link>
            ) : null}
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-label-md text-label-md text-on-primary shadow-sm">
              {page.toLocaleString("ko-KR")}
            </span>
            {hasNextPage ? (
              <Link
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                href={
                  supervisorsPageHref({
                    availability,
                    keyword,
                    page: page + 1,
                    priceMax,
                    priceMin,
                    qualification,
                    sort,
                    specialty
                  }) as never
                }
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </main>

      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-md border-t border-outline-variant bg-surface-container-lowest px-gutter py-xl dark:border-outline dark:bg-surface-container-low md:flex-row">
        <div className="font-headline-sm text-headline-sm font-bold text-primary">
          ClinicFlow
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          <Link
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary"
            href="/privacy"
          >
            개인정보 처리방침
          </Link>
          <Link
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary"
            href="/terms"
          >
            서비스 이용약관
          </Link>
          <Link
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary"
            href="/security"
          >
            보안 기준
          </Link>
          <Link
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary"
            href="/clinical-guidelines"
          >
            임상 가이드라인
          </Link>
        </div>
        <div className="font-body-sm text-body-sm text-on-surface">
          © {currentYear} ClinicFlow.
        </div>
      </footer>
    </div>
  );
}

function SupervisorCard({ supervisor }: { supervisor: profiles.PublicSupervisor }) {
  const products = productSummaries(supervisor.serviceProducts);
  const firstProduct = products[0];

  return (
    <article className="group flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-md transition-all duration-200 hover:border-secondary-fixed-dim hover:bg-surface-bright">
      <div className="mb-md flex items-start gap-md">
        {supervisor.photoUrl ? (
          <img
            alt={`${supervisor.displayName} 프로필`}
            className="h-20 w-20 flex-shrink-0 rounded-full border border-outline-variant object-cover shadow-sm"
            src={supervisor.photoUrl}
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container">
            <span className="material-symbols-outlined text-3xl text-outline">
              person
            </span>
          </div>
        )}
        <div className="min-w-0 flex-grow">
          <div className="flex w-full items-center justify-between gap-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-secondary">
              {supervisor.displayName}
            </h2>
            <div
              className="flex items-center gap-xs rounded-full bg-surface-container-highest px-2 py-0.5"
              title="검증된 슈퍼바이저"
            >
              <span className="material-symbols-outlined filled text-[16px] text-secondary">
                verified
              </span>
              <span className="font-label-sm text-label-sm text-secondary">검증됨</span>
            </div>
          </div>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            {supervisor.headline ?? "소개 문구 미등록"}
          </p>
          <div className="mt-sm flex flex-wrap items-center gap-xs">
            <Star aria-hidden className="fill-secondary text-secondary" size={18} />
            <span className="font-label-md text-label-md text-on-surface">
              {supervisor.averageRating ?? "신규"}
            </span>
            <span className="text-outline-variant mx-1">|</span>
            <span className="font-label-sm text-label-sm text-on-surface">
              {firstProduct
                ? `${firstProduct.priceKrw.toLocaleString("ko-KR")}원 / 건`
                : "제공 항목 미등록"}
            </span>
          </div>
        </div>
      </div>
      <div className="mb-lg flex flex-wrap gap-xs flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-h-[32px] items-center">
        {supervisor.specialties.length === 0 ? (
          <span className="rounded-md border border-outline-variant/30 bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface whitespace-nowrap shrink-0">
            전문분야 미등록
          </span>
        ) : (
          supervisor.specialties.map((specialtyItem) => (
            <span
              className="rounded-md border border-outline-variant/30 bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface whitespace-nowrap shrink-0"
              key={specialtyItem}
            >
              {specialtyItem}
            </span>
          ))
        )}
      </div>
      <Link
        className="w-full cursor-pointer rounded-lg border border-outline-variant bg-surface py-2 text-center font-label-md text-label-md text-on-surface transition-all group-hover:border-primary-container group-hover:bg-primary-container group-hover:text-on-primary"
        href={`/supervisors/${supervisor.id}`}
      >
        프로필 보기
      </Link>
    </article>
  );
}

function parseAvailability(value: string | undefined): AvailabilityFilter | null {
  return value === "this_week" || value === "this_month" ? value : null;
}

function parseNonNegativeInt(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseSort(value: string | undefined): SearchSort {
  return value === "avg_response_minutes" || value === "total_completed"
    ? value
    : "average_rating";
}

function supervisorsPageHref(input: {
  availability: AvailabilityFilter | null;
  keyword: string | null;
  page: number;
  priceMax: number | null;
  priceMin: number | null;
  qualification: string;
  sort: SearchSort;
  specialty: string;
}): string {
  const params = new URLSearchParams();
  if (input.keyword) params.set("keyword", input.keyword);
  if (input.qualification) params.set("qualification", input.qualification);
  if (input.specialty) params.set("specialty", input.specialty);
  if (input.availability) params.set("availability", input.availability);
  if (input.priceMin !== null) params.set("priceMin", String(input.priceMin));
  if (input.priceMax !== null) params.set("priceMax", String(input.priceMax));
  if (input.sort !== "average_rating") params.set("sort", input.sort);
  if (input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `/supervisors?${query}` : "/supervisors";
}

function productSummaries(value: unknown): ProductSummary[] {
  return Array.isArray(value) ? (value as ProductSummary[]) : [];
}
