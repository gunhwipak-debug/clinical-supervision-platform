import Link from "next/link";
import { profiles, withUserContext } from "@csp/db";
import {
  CalendarClock,
  Clock3,
  ClipboardList,
  LayoutGrid,
  PackageCheck,
  ShieldCheck
} from "lucide-react";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { ProductForm, ProductManageForm } from "./product-form";

export const dynamic = "force-dynamic";

export default async function SupervisorProductsPage() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return (
      <AppShell title="상품 관리" subtitle="슈퍼바이저 계정으로 로그인해주세요.">
        <EmptyState
          title="로그인이 필요합니다"
          description="상품은 슈퍼바이저만 관리할 수 있습니다."
        />
      </AppShell>
    );
  }

  const db = createRuntimeDatabase();
  const products = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.listProducts(tx, current.session.userId)
  );

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-6 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link className="flex items-center gap-3" href="/supervisor">
            <PackageCheck aria-hidden size={30} />
            <span className="text-3xl font-bold">ClinicFlow</span>
          </Link>
          <Link
            className="rounded-2xl text-sm font-semibold text-brand-700"
            href="/supervisor/products#new-product"
          >
            상품 추가
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <section>
          <h1 className="text-4xl font-bold">서비스 상품</h1>
          <p className="mt-3 text-xl text-ink-700">
            검색 상세에서 슈퍼바이지가 직접 선택하는 가격과 검토 유형입니다.
          </p>
        </section>

        <div id="new-product">
          <ProductForm />
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="등록된 상품이 없습니다"
            description="검색 상세에서 선택할 수 있는 상품을 하나 이상 준비해주세요."
          />
        ) : (
          <>
            <Card className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <PackageCheck aria-hidden size={22} />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">상품 운영 상태</h2>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      현재 공개 상세에 노출될 서비스 상품을 확인합니다.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">
                    운영 {String(products.filter((product) => product.active).length)}개
                  </Badge>
                  <Badge tone="neutral">전체 {String(products.length)}개</Badge>
                </div>
              </div>
            </Card>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="grid gap-4 rounded-3xl border-line bg-surface-elevated p-6 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-ink-900">
                        {product.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">
                        {product.description ?? "상세 설명 미등록"}
                      </p>
                    </div>
                    <Badge tone={product.active ? "brand" : "neutral"}>
                      {product.active ? "운영" : "중지"}
                    </Badge>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-4">
                    <span className="text-sm font-semibold text-ink-500">가격</span>
                    <strong className="mt-1 block text-2xl text-ink-900">
                      {product.priceKrw.toLocaleString("ko-KR")}원
                    </strong>
                  </div>
                  <div className="grid gap-2 text-sm text-ink-500">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-surface-base px-3 py-2">
                      <ShieldCheck aria-hidden size={16} />
                      {productKindLabel(product.kind)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-surface-base px-3 py-2">
                      <Clock3 aria-hidden size={16} />
                      {String(product.turnaroundHours ?? 72)}시간 이내 응답
                    </span>
                  </div>
                  <ProductManageForm
                    product={{
                      active: product.active,
                      description: product.description,
                      id: product.id,
                      kind: product.kind,
                      priceKrw: product.priceKrw,
                      title: product.title,
                      turnaroundHours: product.turnaroundHours
                    }}
                  />
                </Card>
              ))}
            </section>
          </>
        )}
      </div>
      <SupervisorBottomNav active="서비스 상품" />
    </main>
  );
}

function productKindLabel(kind: profiles.ServiceProductKind): string {
  const labels: Record<profiles.ServiceProductKind, string> = {
    async_comment: "비동기 코멘트",
    async_direct_edit: "비동기 직접 수정",
    zoom_60: "화상 회의 60분",
    zoom_90: "화상 회의 90분",
    urgent_24h: "24시간 긴급 검토"
  };
  return labels[kind];
}

function SupervisorBottomNav({ active }: { active: string }) {
  return (
    <nav className="border-t border-line bg-surface-elevated px-4 py-3">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 text-center text-sm font-medium text-ink-700">
        {(
          [
            { href: "/supervisor", label: "대시보드", icon: LayoutGrid },
            { href: "/supervisor/requests", label: "의뢰 검토", icon: ClipboardList },
            {
              href: "/supervisor/availability",
              label: "일정",
              icon: CalendarClock
            },
            { href: "/supervisor/products", label: "서비스 상품", icon: PackageCheck }
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const selected = item.label === active;
          return (
            <Link
              className={`grid place-items-center gap-1 rounded-full px-3 py-2 ${
                selected ? "bg-brand-500 text-white" : "text-ink-700"
              }`}
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden size={24} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
