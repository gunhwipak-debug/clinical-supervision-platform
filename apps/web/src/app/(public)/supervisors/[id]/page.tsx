/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { calendar, profiles, supervision, withUserContext } from "@csp/db";
import { Star } from "lucide-react";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { isSupervisor } from "../../../../lib/auth/guards";
import {
  type BusyInterval,
  getGoogleCalendarConfig,
  googleCalendarBlockReason,
  intervalsOverlap,
  listBusyIntervalsForConnection
} from "../../../../lib/google-calendar";

type ProductSummary = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  priceKrw: number;
  turnaroundHours: number | null;
};

const weekdays = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const current = await getCurrentUser();
  const { id } = await params;
  const query = await searchParams;
  const weekOffset = parseWeekOffset(query.week, new Date());
  const db = createRuntimeDatabase();
  const supervisor = await profiles.getPublicSupervisorDetails(db, id);

  if (!supervisor) {
    return (
      <main className="min-h-screen bg-background px-margin-mobile py-xl text-on-surface md:px-gutter">
        <section className="mx-auto max-w-2xl rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center">
          <h1 className="font-headline-md text-headline-md text-primary">
            프로필이 없습니다
          </h1>
          <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
            검색 목록으로 돌아가 다른 슈퍼바이저를 확인해주세요.
          </p>
          <Link
            className="mt-md inline-flex rounded-lg border border-outline-variant px-md py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container"
            href="/supervisors"
          >
            검색으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const products = productSummaries(supervisor.serviceProducts);
  const timedProducts = products.filter((product) =>
    isTimedBookingProduct(product.kind)
  );
  const firstProduct = products[0];
  const calendarDays = buildCalendarDays(weekOffset);
  const now = new Date();
  const slots = await profiles.listPublicAvailabilityForProfile(db, supervisor.id);
  const availabilityState = await loadAvailabilityState(
    db,
    supervisor.userId,
    supervisor.id,
    calendarDays
  );
  const slotsByWeekday = groupSlotsByWeekday(slots);
  const availabilityHref = calendarWeekHref(supervisor.id, weekOffset);
  const previousWeekHref = calendarWeekHref(supervisor.id, Math.max(weekOffset - 1, 0));
  const nextWeekHref = calendarWeekHref(supervisor.id, weekOffset + 1);
  const weekTitle = calendarWeekTitle(calendarDays);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface antialiased">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-outline-variant bg-surface dark:border-outline dark:bg-inverse-surface">
        <div className="mx-auto flex h-16 w-full max-w-container-max items-center justify-between px-gutter">
          <div className="flex items-center gap-lg">
            <Link
              className="cursor-pointer font-headline-md text-headline-md font-bold text-primary active:opacity-80 dark:text-inverse-primary"
              href="/"
            >
              ClinicFlow
            </Link>
            <nav className="ml-xl hidden items-center gap-md md:flex">
              <Link
                className="cursor-pointer border-b-2 border-secondary pb-1 font-label-md text-label-md text-secondary active:opacity-80 dark:border-secondary-fixed dark:text-secondary-fixed"
                href="/supervisors"
              >
                슈퍼바이저 찾기
              </Link>
              <Link
                className="cursor-pointer font-label-md text-label-md text-on-surface-variant transition-colors hover:text-secondary active:opacity-80 dark:text-surface-variant dark:hover:text-secondary-fixed"
                href="/requests"
              >
                내 의뢰
              </Link>
              <Link
                className="cursor-pointer font-label-md text-label-md text-on-surface-variant transition-colors hover:text-secondary active:opacity-80 dark:text-surface-variant dark:hover:text-secondary-fixed"
                href="/resources"
              >
                자료실
              </Link>
              {current && !isSupervisor(current) ? (
                <Link
                  className="cursor-pointer font-label-md text-label-md text-on-surface-variant transition-colors hover:text-secondary active:opacity-80 dark:text-surface-variant dark:hover:text-secondary-fixed"
                  href="/settings"
                >
                  슈퍼바이저 신청
                </Link>
              ) : null}
              {current && isSupervisor(current) ? (
                <Link
                  className="cursor-pointer font-label-md text-label-md text-on-surface-variant transition-colors hover:text-secondary active:opacity-80 dark:text-surface-variant dark:hover:text-secondary-fixed"
                  href="/supervisor"
                >
                  슈퍼바이저 전용
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-md">
            {current ? (
              <div className="flex items-center gap-sm">
                <Link
                  className="hidden cursor-pointer rounded-lg border border-outline bg-surface px-md py-2 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-container active:opacity-80 md:block"
                  href="/settings"
                >
                  계정 설정
                </Link>
                <Link
                  className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-outline bg-surface-container-highest active:opacity-80 md:hidden"
                  href="/settings"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    settings
                  </span>
                </Link>
              </div>
            ) : (
              <>
                <Link
                  className="hidden cursor-pointer rounded-lg bg-primary px-md py-2 font-label-md text-label-md text-on-primary transition-all hover:bg-opacity-90 active:opacity-80 md:block"
                  href="/login"
                >
                  보안 로그인
                </Link>
                <Link
                  className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-highest active:opacity-80 md:hidden"
                  href="/login"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">
                    person
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-container-max flex-grow px-margin-mobile pb-xl pt-[88px] md:px-gutter">
        <div className="mb-md">
          <Link
            className="flex items-center gap-xs font-label-sm text-label-sm text-secondary hover:underline"
            href="/supervisors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            검색 결과로 돌아가기
          </Link>
        </div>

        <div className="bento-grid grid-cols-12">
          <aside className="col-span-12 flex flex-col gap-lg md:col-span-4">
            <div className="glass-card sticky top-[88px] rounded-xl p-lg">
              <div className="flex flex-col items-center text-center">
                <div className="mb-md h-32 w-32 overflow-hidden rounded-full border-2 border-surface-container-highest bg-surface-container">
                  {supervisor.photoUrl ? (
                    <img
                      alt={`${supervisor.displayName} 프로필`}
                      className="h-full w-full object-cover"
                      src={supervisor.photoUrl}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <span className="material-symbols-outlined text-5xl text-outline">
                        person
                      </span>
                    </div>
                  )}
                </div>
                <h1 className="mb-xs font-headline-md text-headline-md text-primary">
                  {supervisor.displayName}
                </h1>
                <p className="mb-md font-body-md text-body-md text-on-surface-variant">
                  {supervisor.headline ?? "공개 슈퍼비전 프로필"}
                </p>
                <div className="mb-lg flex flex-wrap justify-center gap-xs">
                  {supervisor.specialties.length === 0 ? (
                    <span className="rounded-full border border-outline-variant bg-surface-container px-sm py-xs font-label-sm text-label-sm text-on-primary-fixed">
                      전문분야 미등록
                    </span>
                  ) : (
                    supervisor.specialties.slice(0, 4).map((specialty) => (
                      <span
                        className="rounded-full border border-outline-variant bg-surface-container px-sm py-xs font-label-sm text-label-sm text-on-primary-fixed"
                        key={specialty}
                      >
                        {specialty}
                      </span>
                    ))
                  )}
                </div>
                <div className="mb-lg w-full border-t border-outline-variant pt-md">
                  <div className="mb-sm flex items-center justify-between gap-sm">
                    <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
                      <Star
                        aria-hidden
                        className="fill-on-surface-variant text-on-surface-variant"
                        size={16}
                      />
                      {supervisor.averageRating ?? "신규"}
                    </span>
                    <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">
                        work_history
                      </span>
                      {supervisor.yearsOfExperience
                        ? `${String(supervisor.yearsOfExperience)}년 경력`
                        : "경력 정보 미등록"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-sm">
                    <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">
                        task_alt
                      </span>
                      완료 {String(supervisor.totalCompleted)}건
                    </span>
                    <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">
                        schedule
                      </span>
                      {supervisor.avgResponseMinutes
                        ? `평균 ${String(supervisor.avgResponseMinutes)}분 응답`
                        : "응답 정보 미등록"}
                    </span>
                  </div>
                </div>
                {firstProduct ? (
                  <>
                    <Link
                      className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary py-sm font-label-md text-label-md text-on-primary transition-all hover:bg-opacity-90"
                      href={
                        timedProducts.length > 0
                          ? (availabilityHref as never)
                          : (`/requests/new?supervisorId=${supervisor.id}&serviceProductId=${firstProduct.id}` as never)
                      }
                    >
                      <span className="material-symbols-outlined">calendar_month</span>
                      {timedProducts.length > 0 ? "가능 일정 선택하기" : "의뢰 신청하기"}
                    </Link>
                    <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">
                      {timedProducts.length > 0
                        ? "일정 예약 상품은 가능 시간을 먼저 선택합니다."
                        : "비동기 상품은 일정 예약 없이 신청서를 시작합니다."}
                    </p>
                  </>
                ) : (
                  <div className="flex w-full items-center justify-center gap-sm rounded-lg bg-surface-dim py-sm font-label-md text-label-md text-on-surface-variant">
                    의뢰 가능한 상품 없음
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="col-span-12 flex flex-col gap-lg md:col-span-8">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <h2 className="mb-md border-b border-outline-variant pb-xs font-headline-md text-headline-md text-primary">
                소개
              </h2>
              <p className="mb-md whitespace-pre-wrap font-body-md text-body-md leading-relaxed text-on-surface-variant">
                {supervisor.bio ?? "등록된 소개 문구가 없습니다."}
              </p>
            </section>

            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              <section className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-lg h-full">
                <div>
                  <h2 className="mb-md flex items-center gap-sm font-headline-md text-headline-md text-primary">
                    <span className="material-symbols-outlined">school</span>
                    학력 및 자격
                  </h2>
                  <ul className="space-y-sm">
                    {supervisor.qualifications.length === 0 ? (
                      <li className="font-body-sm text-body-sm text-on-surface-variant">
                        공개된 자격 정보가 없습니다.
                      </li>
                    ) : (
                      supervisor.qualifications.map((qualification) => (
                        <li className="flex items-start gap-sm" key={qualification.name}>
                          <span className="material-symbols-outlined mt-1 text-[20px] text-secondary">
                            check_circle
                          </span>
                          <div>
                            <p className="font-label-md text-label-md">
                              {qualification.name}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </section>

              <section className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-lg h-full">
                <div>
                  <h2 className="mb-md flex items-center gap-sm font-headline-md text-headline-md text-primary">
                    <span className="material-symbols-outlined">work</span>
                    주요 경력
                  </h2>
                  <div className="border-l-2 border-surface-container-highest pl-md">
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      등록된 공개 경력 정보는 현재 프로필 소개와 자격 항목을 기준으로
                      확인합니다.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg"
              id="service-products"
            >
              <h2 className="mb-md flex items-center gap-sm font-headline-md text-headline-md text-primary">
                <span className="material-symbols-outlined">inventory_2</span>
                서비스 상품
              </h2>
              <div className="space-y-md">
                {products.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    공개 상품이 아직 없습니다.
                  </p>
                ) : (
                  products.map((product) => (
                    <div
                      className="group flex flex-col items-start justify-between rounded-lg border border-outline-variant bg-surface p-md transition-colors hover:border-secondary md:flex-row md:items-center"
                      key={product.id}
                    >
                      <div className="mb-sm md:mb-0">
                        <div className="mb-xs flex items-center gap-sm">
                          <h3 className="font-label-md text-lg text-primary">
                            {product.title}
                          </h3>
                          <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-bold text-secondary">
                            {isTimedBookingProduct(product.kind) ? "일정 예약" : "비동기"}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {product.description ?? "상세 설명 미등록"}
                        </p>
                      </div>
                      <div className="flex w-full flex-row items-center justify-between gap-sm md:w-auto md:flex-col md:items-end">
                        <span className="font-headline-md text-headline-md text-primary">
                          ₩ {product.priceKrw.toLocaleString("ko-KR")}
                        </span>
                        <Link
                          className="font-label-md text-label-md text-secondary group-hover:underline"
                          href={
                            isTimedBookingProduct(product.kind)
                              ? (availabilityHref as never)
                              : (`/requests/new?supervisorId=${supervisor.id}&serviceProductId=${product.id}` as never)
                          }
                        >
                          {isTimedBookingProduct(product.kind) ? "일정 선택" : "바로 의뢰"}
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg"
              id="availability"
            >
              <div className="mb-md flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
                <h2 className="flex items-center gap-sm font-headline-md text-headline-md text-primary">
                  <span className="material-symbols-outlined">event_available</span>
                  가능 일정 미리보기
                </h2>
                <div className="flex items-center gap-xs">
                  {weekOffset === 0 ? (
                    <span className="inline-flex items-center justify-center rounded-md border border-outline-variant px-sm py-xs font-label-sm text-label-sm text-on-surface-variant opacity-50">
                      이전 주
                    </span>
                  ) : (
                    <Link
                      className="inline-flex items-center justify-center rounded-md border border-outline-variant px-sm py-xs font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container"
                      href={previousWeekHref as never}
                    >
                      이전 주
                    </Link>
                  )}
                  <Link
                    className="inline-flex items-center justify-center rounded-md border border-outline-variant px-sm py-xs font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container"
                    href={nextWeekHref as never}
                  >
                    다음 주
                  </Link>
                </div>
              </div>
              {slots.length === 0 ? (
                <p className="rounded-lg border border-outline-variant bg-surface p-md font-body-sm text-body-sm text-on-surface-variant">
                  공개된 가능시간이 없습니다. 의뢰 후 별도 조율합니다.
                </p>
              ) : (
                <div className="overflow-x-auto calendar-scroll">
                  <div className="mb-sm flex flex-col gap-xs rounded-lg border border-outline-variant bg-surface px-md py-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-primary">
                        {weekTitle}
                      </p>
                      <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                        일정 예약 상품만 표시합니다. 비동기 상품은 서비스 상품에서 바로
                        의뢰하세요.
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Asia/Seoul 기준
                    </span>
                  </div>
                  {availabilityState.calendarNotice ? (
                    <p className="mb-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm font-body-sm text-body-sm text-on-surface-variant">
                      {availabilityState.calendarNotice}
                    </p>
                  ) : null}
                  <div className="min-w-[760px] rounded-xl border border-outline-variant bg-surface">
                    <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
                      {calendarDays.map((day) => (
                        <div
                          className="border-r border-outline-variant px-sm py-sm text-center last:border-r-0"
                          key={day.isoDate}
                        >
                          <p className="font-label-md text-label-md text-on-surface">
                            {day.weekdayLabel}
                          </p>
                          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                            {day.monthDayLabel}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {calendarDays.map((day) => {
                        const dayOptions = buildBookableOptions({
                          busyIntervals: availabilityState.busyIntervals,
                          day,
                          now,
                          products: availabilityState.bookingDisabled ? [] : timedProducts,
                          slots: slotsByWeekday.get(day.weekday) ?? []
                        });
                        const emptyLabel =
                          availabilityState.bookingDisabled
                            ? "캘린더 확인 필요"
                            : timedProducts.length === 0
                            ? "예약 상품 없음"
                            : products.length === 0
                            ? "의뢰 가능한 상품 없음"
                            : "가능 일정 없음";
                        return (
                          <div
                            className="min-h-40 border-r border-outline-variant p-xs last:border-r-0"
                            key={day.isoDate}
                          >
                            {dayOptions.length === 0 ? (
                              <div className="flex h-full min-h-28 items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-xs text-center font-label-sm text-label-sm text-on-surface-variant">
                                {emptyLabel}
                              </div>
                            ) : (
                              <div className="space-y-xs">
                                {dayOptions.map((option) => (
                                  <div
                                    className="rounded-lg border border-secondary/60 bg-surface-container-lowest p-1.5"
                                    key={`${day.isoDate}-${option.product.id}-${option.startTime}`}
                                  >
                                    <p className="text-[13px] font-semibold text-secondary text-center">
                                      {option.startTime} - {option.endTime}
                                    </p>
                                    <Link
                                      className="mt-1 block rounded-md bg-primary py-1 text-center text-[11px] font-semibold text-on-primary hover:bg-opacity-90 transition-all truncate"
                                      href={`/requests/new?supervisorId=${supervisor.id}&serviceProductId=${option.product.id}&slot=${encodeURIComponent(slotRequestLabel(day, option))}&slotStart=${encodeURIComponent(slotDateTimeIso(day, option.startTime))}&slotEnd=${encodeURIComponent(slotDateTimeIso(day, option.endTime))}`}
                                      title={option.product.title}
                                    >
                                      {option.product.title}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function productSummaries(value: unknown): ProductSummary[] {
  return Array.isArray(value) ? (value as ProductSummary[]) : [];
}

type CalendarDay = {
  date: Date;
  isoDate: string;
  weekday: number;
  weekdayLabel: string;
  monthDayLabel: string;
};

function buildCalendarDays(weekOffset: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  start.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const weekday = date.getDay();
    return {
      date,
      isoDate: isoDate(date),
      weekday,
      weekdayLabel: weekdays[weekday] ?? "요일",
      monthDayLabel: `${String(date.getMonth() + 1)}/${String(date.getDate())}`
    };
  });
}

function parseWeekOffset(value: string | undefined, now: Date): number {
  const parsed = Number(value ?? String(defaultCalendarWeekOffset(now)));
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.trunc(parsed), 0), 12);
}

function defaultCalendarWeekOffset(now: Date): number {
  const todayKst = new Date(`${formatKstDate(now)}T00:00:00`);
  const weekday = todayKst.getDay();
  return weekday === 0 || weekday === 6 ? 1 : 0;
}

function calendarWeekHref(supervisorId: string, weekOffset: number): string {
  const query = weekOffset > 0 ? `?week=${String(weekOffset)}` : "";
  return `/supervisors/${supervisorId}${query}#availability`;
}

function calendarWeekTitle(days: CalendarDay[]): string {
  const first = days[0]?.date ?? new Date();
  const last = days[days.length - 1]?.date ?? first;
  const firstMonth = String(first.getMonth() + 1);
  const firstDate = String(first.getDate());
  const lastMonth = String(last.getMonth() + 1);
  const lastDate = String(last.getDate());
  return `${String(first.getFullYear())}년 ${firstMonth}월 ${String(weekOfMonth(first))}주차 · ${firstMonth}/${firstDate}-${lastMonth}/${lastDate}`;
}

function groupSlotsByWeekday(
  slots: profiles.PublicAvailabilitySlot[]
): Map<number, profiles.PublicAvailabilitySlot[]> {
  const grouped = new Map<number, profiles.PublicAvailabilitySlot[]>();
  for (const slot of slots) {
    const current = grouped.get(slot.weekday) ?? [];
    current.push(slot);
    grouped.set(slot.weekday, current);
  }
  for (const daySlots of grouped.values()) {
    daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return grouped;
}

function slotRequestLabel(
  day: CalendarDay,
  slot: { endTime: string; startTime: string }
): string {
  return `${day.isoDate} (${day.weekdayLabel}) ${slot.startTime}-${slot.endTime}`;
}

type BookableOption = {
  endTime: string;
  product: ProductSummary;
  startTime: string;
};

function buildBookableOptions({
  busyIntervals,
  day,
  now,
  products,
  slots
}: {
  busyIntervals: BusyInterval[];
  day: CalendarDay;
  now: Date;
  products: ProductSummary[];
  slots: profiles.PublicAvailabilitySlot[];
}): BookableOption[] {
  const options: BookableOption[] = [];
  for (const slot of slots) {
    const blockStart = timeToMinutes(slot.startTime);
    const blockEnd = timeToMinutes(slot.endTime);
    for (const product of products) {
      const duration = productDurationMinutes(product.kind);
      for (
        let start = blockStart;
        start + duration <= blockEnd;
        start += availabilityStepMinutes(duration)
      ) {
        const startTime = minutesToTime(start);
        const endTime = minutesToTime(start + duration);
        if (slotDateTime(day, startTime).getTime() <= now.getTime()) continue;
        if (isTimeRangeBusy(day, startTime, endTime, busyIntervals)) continue;
        options.push({ endTime, product, startTime });
      }
    }
  }

  return options.sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime) ||
      a.product.title.localeCompare(b.product.title)
  );
}

function productDurationMinutes(kind: string): number {
  return kind === "zoom_90" ? 90 : 60;
}

function isTimedBookingProduct(kind: string | null | undefined): boolean {
  return kind === "zoom_60" || kind === "zoom_90";
}

function availabilityStepMinutes(duration: number): number {
  return duration >= 90 ? 30 : 60;
}

async function loadAvailabilityState(
  db: ReturnType<typeof createRuntimeDatabase>,
  supervisorUserId: string,
  supervisorProfileId: string,
  days: CalendarDay[]
): Promise<{
  bookingDisabled: boolean;
  busyIntervals: BusyInterval[];
  calendarNotice: string | null;
}> {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) {
    return { busyIntervals: [], bookingDisabled: false, calendarNotice: null };
  }

  const timeMin = new Date(`${first.isoDate}T00:00:00+09:00`);
  const timeMax = new Date(`${last.isoDate}T23:59:59+09:00`);
  const localBusy = await withUserContext(
    db,
    { userId: supervisorUserId, role: "supervisor" },
    (tx) =>
      supervision.listBusyBookingIntervalsForSupervisor(tx, {
        supervisorId: supervisorUserId,
        timeMax,
        timeMin
      })
  );

  const localIntervals = localBusy.map((item) => ({
    end: new Date(item.end),
    start: new Date(item.start)
  }));

  const connection = await withUserContext(
    db,
    { userId: supervisorUserId, role: "supervisor", phiAccess: true },
    (tx) => calendar.getConnectionForSupervisorProfile(tx, supervisorProfileId)
  );
  if (!connection) {
    return {
      busyIntervals: localIntervals,
      bookingDisabled: false,
      calendarNotice:
        "플랫폼 예약 및 설정된 가용 시간표 기준으로 예약을 접수합니다."
    };
  }

  const config = getGoogleCalendarConfig(
    process.env["NEXT_PUBLIC_WEB_URL"] ??
      process.env["NEXT_PUBLIC_APP_URL"] ??
      process.env["APP_URL"] ??
      "http://localhost:3000"
  );
  const calendarBlock = googleCalendarBlockReason(connection, config);
  if (calendarBlock) {
    return {
      busyIntervals: localIntervals,
      bookingDisabled: false,
      calendarNotice: `${publicCalendarBlockNotice(calendarBlock)} (플랫폼 내장 캘린더 스케줄 기준으로 우선 예약 가능합니다)`
    };
  }

  try {
    const googleBusy = await withUserContext(
      db,
      { userId: supervisorUserId, role: "supervisor", phiAccess: true },
      (tx) => listBusyIntervalsForConnection(tx, connection, config, timeMin, timeMax)
    );
    return {
      busyIntervals: [...localIntervals, ...googleBusy],
      bookingDisabled: false,
      calendarNotice:
        "구글 캘린더의 바쁜 시간과 플랫폼 예약을 통합 검사하여 일정을 표시합니다."
    };
  } catch {
    return {
      busyIntervals: localIntervals,
      bookingDisabled: false,
      calendarNotice:
        "구글 캘린더 상태 확인 불가로, 플랫폼 스케줄 기준으로 가능 일정을 표시합니다."
    };
  }
}

function publicCalendarBlockNotice(
  code: "calendar_config_required" | "calendar_reauth_required" | "calendar_sync_failed"
): string {
  const labels = {
    calendar_config_required:
      "서비스의 구글 캘린더 연동 설정이 완료되지 않아 현재 예약을 받을 수 없습니다. 캘린더 설정 완료 후 정확한 가능 시간이 표시됩니다.",
    calendar_reauth_required:
      "슈퍼바이저의 구글 캘린더 재연동이 필요해 현재 예약을 받을 수 없습니다. 재연동 후 정확한 가능 시간이 표시됩니다.",
    calendar_sync_failed:
      "슈퍼바이저의 구글 캘린더 동기화 오류로 현재 예약을 받을 수 없습니다. 동기화 점검 후 정확한 가능 시간이 표시됩니다."
  } satisfies Record<typeof code, string>;
  return labels[code];
}

function isTimeRangeBusy(
  day: CalendarDay,
  startTime: string,
  endTime: string,
  busyIntervals: BusyInterval[]
): boolean {
  const start = slotDateTime(day, startTime);
  const end = slotDateTime(day, endTime);
  return busyIntervals.some((interval) =>
    intervalsOverlap(start, end, interval.start, interval.end)
  );
}

function slotDateTimeIso(day: CalendarDay, time: string): string {
  return slotDateTime(day, time).toISOString();
}

function slotDateTime(day: CalendarDay, time: string): Date {
  return new Date(`${day.isoDate}T${time}:00+09:00`);
}

function timeToMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function weekOfMonth(date: Date): number {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstMondayOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  return Math.ceil((date.getDate() + firstMondayOffset) / 7);
}

function formatKstDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function isoDate(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
