import Link from "next/link";
import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import {
  PrimaryActionPanel,
  SectionBlock
} from "../../../../components/clinicflow-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { ProductForm, ProductManageForm } from "./product-form";

export const dynamic = "force-dynamic";

export default async function SupervisorProductsPage() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="슈퍼비전 방식" returnTo="/supervisor/products" />;
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        title="슈퍼비전 방식"
        description="슈퍼비전 방식 관리는 슈퍼바이저 계정에서만 사용할 수 있습니다."
      />
    );
  }

  const db = createRuntimeDatabase();
  const products = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.listProducts(tx, current.session.userId)
  );

  const activeProducts = products.filter((product) => product.active);

  return (
    <AppShell
      active="supervisor"
      title="슈퍼비전 방식"
      subtitle="신청자가 선택할 세션 유형, 가격, 응답 기준을 간결하게 정리합니다."
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">업무 홈</Link>
        </Button>
      }
    >
      <PrimaryActionPanel
        action={
          <Button asChild variant="secondary">
            <Link href="#new-product">새 방식 추가</Link>
          </Button>
        }
        title={
          products.length === 0
            ? "먼저 하나의 슈퍼비전 방식을 준비하세요"
            : "공개 목록에 보일 방식을 확인하세요"
        }
      >
        {products.length === 0
          ? "신청자가 의뢰 전에 선택할 세션명, 가격, 응답 시간을 한 줄씩 정리합니다."
          : `현재 공개 중인 방식은 ${String(activeProducts.length)}개입니다. 중지된 방식은 신청자에게 보이지 않습니다.`}
      </PrimaryActionPanel>

      <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <SectionBlock
          subtitle="카드처럼 흩어놓지 않고, 운영 상태와 수정 항목을 한 줄 흐름으로 확인합니다."
          title="등록된 슈퍼비전 방식"
        >
          {products.length === 0 ? (
            <EmptyState
              title="등록된 슈퍼비전 방식이 없습니다"
              description="검색 상세에서 선택할 수 있는 세션 유형을 하나 이상 준비해주세요."
            />
          ) : (
            <div className="grid gap-3">
              {products.map((product) => (
                <details
                  className="rounded-xl border border-line bg-surface-elevated p-5"
                  key={product.id}
                >
                  <summary className="cursor-pointer list-none">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge tone={product.active ? "brand" : "neutral"}>
                            {product.active ? "공개 중" : "중지됨"}
                          </Badge>
                          <Badge tone="neutral">{productKindLabel(product.kind)}</Badge>
                        </div>
                        <h2 className="text-lg font-bold text-ink-900">
                          {product.title}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-ink-500">
                          {product.description ?? "설명 미등록"}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xl font-bold text-ink-900">
                          {product.priceKrw.toLocaleString("ko-KR")}원
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink-500">
                          {String(product.turnaroundHours ?? 72)}시간 이내 응답
                        </p>
                      </div>
                    </div>
                  </summary>
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
                </details>
              ))}
            </div>
          )}
        </SectionBlock>

        <aside className="h-fit lg:sticky lg:top-24" id="new-product">
          <ProductForm />
        </aside>
      </section>
    </AppShell>
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
