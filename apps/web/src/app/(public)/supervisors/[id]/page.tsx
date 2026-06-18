import { profiles } from "@csp/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { SiteHeader } from "../../../../components/clinicflow-shell";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import {
  displaySupervisionMethodDescription,
  displaySupervisionMethodName,
  durationMinutesForProduct,
  isTimedBookingKind
} from "../../../../lib/supervision-method-catalog";

type PublicSupervisorDetail = NonNullable<
  Awaited<ReturnType<typeof profiles.getPublicSupervisorDetails>>
>;

type SupervisorProduct = {
  id: string;
  kind?: string | null;
  title: string;
  description: string | null;
  priceKrw: number;
  turnaroundHours: number | null;
};

export const dynamic = "force-dynamic";

export default async function SupervisorDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadSupervisor(id);

  if (result.notFound) notFound();

  return (
    <main className="min-h-screen bg-surface-base text-ink-900">
      <SiteHeader active="supervisors" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:px-8">
        {result.error || !result.supervisor ? (
          <section className="rounded-xl border border-line bg-surface-elevated p-6">
            <h1 className="text-2xl font-bold text-ink-900">
              프로필을 불러오지 못했습니다
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">
              현재 이 프로필을 표시할 수 없습니다. 슈퍼바이저 찾기로 돌아가 다른
              프로필을 확인해주세요.
            </p>
            <Button asChild className="mt-5" variant="secondary">
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
          </section>
        ) : (
          <SupervisorDetail supervisor={result.supervisor} />
        )}
      </div>
    </main>
  );
}

async function loadSupervisor(id: string): Promise<{
  error: boolean;
  notFound: boolean;
  supervisor: PublicSupervisorDetail | null;
}> {
  try {
    const db = createRuntimeDatabase();
    const supervisor = await profiles.getPublicSupervisorDetails(db, id);
    return { error: false, notFound: !supervisor, supervisor };
  } catch {
    return { error: true, notFound: false, supervisor: null };
  }
}

function SupervisorDetail({ supervisor }: { supervisor: PublicSupervisorDetail }) {
  const products = normalizeProducts(supervisor.serviceProducts);
  const primaryProduct = products[0];
  const startHref = primaryProduct
    ? `/requests/new?supervisorId=${supervisor.id}&serviceProductId=${primaryProduct.id}`
    : "/requests/new";

  return (
    <>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid gap-6">
          <div className="grid gap-6 rounded-xl border border-line bg-surface-elevated p-6 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="h-48 overflow-hidden rounded-xl bg-surface-sunken md:h-40">
              {supervisor.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${supervisor.displayName} 슈퍼바이저 사진`}
                  className="h-full w-full object-cover"
                  src={supervisor.photoUrl}
                />
              ) : (
                <div className="grid h-full place-items-center text-4xl font-bold text-brand-700">
                  {supervisor.displayName.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="grid gap-4">
              <div>
                <span className="w-fit rounded-md border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                  슈퍼바이저 프로필
                </span>
                <h1 className="mt-4 break-keep text-4xl font-bold leading-tight text-ink-900 md:text-5xl">
                  {supervisor.displayName}
                </h1>
                <p className="mt-3 max-w-2xl break-keep text-base leading-relaxed text-ink-600">
                  {supervisor.headline ?? "프로필 내용을 확인한 뒤 세션을 선택합니다."}
                </p>
              </div>
              <dl className="grid gap-3 text-sm leading-relaxed text-ink-700 md:grid-cols-3">
                <div>
                  <dt className="font-bold text-ink-500">자격</dt>
                  <dd>{qualificationText(supervisor)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-ink-500">전문분야</dt>
                  <dd>{supervisor.specialties.join(", ") || "상담·평가 슈퍼비전"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-ink-500">경력</dt>
                  <dd>{experienceText(supervisor.yearsOfExperience)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <section className="grid gap-4">
            <h2 className="text-2xl font-bold text-ink-900">자기소개</h2>
            <p className="max-w-3xl break-keep text-base leading-8 text-ink-700">
              {supervisor.bio ??
                "슈퍼비전 방식과 전문분야 소개가 준비되는 중입니다. 세션 정보와 자격을 먼저 확인해주세요."}
            </p>
          </section>

          <section className="grid gap-4">
            <h2 className="text-2xl font-bold text-ink-900">슈퍼비전 방식 선택</h2>
            <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
              {products.length === 0 ? (
                <p className="p-5 text-sm leading-relaxed text-ink-500">
                  아직 신청 가능한 슈퍼비전 방식이 없습니다. 다른 슈퍼바이저를
                  확인해주세요.
                </p>
              ) : (
                products.map((product) => (
                  <article
                    className="grid gap-3 border-b border-line p-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    key={product.id}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-ink-900">
                        {displaySupervisionMethodName(product)}
                      </h3>
                      <p className="mt-1 break-keep text-sm leading-relaxed text-ink-500">
                        {displaySupervisionMethodDescription(product)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Badge tone="accent">{formatKrw(product.priceKrw)}</Badge>
                      {isTimedBookingKind(product.kind) ? (
                        <Badge tone="neutral">
                          {String(durationMinutesForProduct(product) ?? 90)}분
                        </Badge>
                      ) : null}
                      <Button asChild>
                        <Link
                          href={`/requests/new?supervisorId=${supervisor.id}&serviceProductId=${product.id}`}
                        >
                          이 방식으로 신청
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-6 lg:sticky lg:top-28">
          <h2 className="text-xl font-bold text-ink-900">신청 전 확인</h2>
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed">
            <div>
              <dt className="font-bold text-ink-500">대표 방식</dt>
              <dd className="mt-1 text-ink-900">
                {primaryProduct
                  ? displaySupervisionMethodName(primaryProduct)
                  : "상세 방식 준비 중"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">준비할 자료</dt>
              <dd className="mt-1 text-ink-900">보고서, 검사 결과, 질문</dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">신청 절차</dt>
              <dd className="mt-1 text-ink-900">
                방식에 따라 예약 시간 선택 여부가 달라집니다
              </dd>
            </div>
          </dl>
          <Button asChild className="mt-6 w-full">
            <Link href={startHref as never}>슈퍼비전 신청하기</Link>
          </Button>
        </aside>
      </section>
    </>
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
    (typeof product["kind"] === "string" ||
      product["kind"] === null ||
      typeof product["kind"] === "undefined") &&
    typeof product["title"] === "string" &&
    typeof product["priceKrw"] === "number" &&
    (typeof product["description"] === "string" || product["description"] === null) &&
    (typeof product["turnaroundHours"] === "number" ||
      product["turnaroundHours"] === null)
  );
}

function qualificationText(supervisor: PublicSupervisorDetail): string {
  if (supervisor.qualifications.length === 0) return "승인된 슈퍼바이저";
  return supervisor.qualifications.map((item) => item.name).join(" · ");
}

function experienceText(value: number | null): string {
  if (!value) return "프로필 확인";
  return `${value.toLocaleString("ko-KR")}년`;
}

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}
