import Link from "next/link";
import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { SectionBlock } from "../../../../components/clinicflow-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";
import { SupervisorPageLoadError } from "../_components/supervisor-page-load-error";
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
        currentUser={current.user}
        title="슈퍼비전 방식"
        description="슈퍼비전 방식 관리는 슈퍼바이저 계정에서만 사용할 수 있습니다."
      />
    );
  }

  let products: profiles.Product[];

  try {
    const db = createRuntimeDatabase();
    products = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listProducts(tx, current.session.userId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      console.error("[supervisor.products.page]", error);
      return (
        <SupervisorPageLoadError
          active="supervisor-products"
          currentUser={current.user}
          title="슈퍼비전 방식"
          subtitle="슈퍼비전 방식 정보를 불러오는 동안 문제가 생겼습니다."
        />
      );
    }

    products = [];
  }

  const activeProducts = products.filter((product) => product.active);

  return (
    <AppShell
      active="supervisor-products"
      currentUser={current.user}
      title="슈퍼비전 방식"
      subtitle="세션명, 가격, 응답 시간을 등록합니다."
      action={
        <Button asChild>
          <Link href="#new-product">새 방식 추가</Link>
        </Button>
      }
    >
      <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <SectionBlock
          title={`등록된 슈퍼비전 방식 ${String(activeProducts.length)}개 공개`}
        >
          <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_140px_100px] gap-4 border-b border-line bg-surface-sunken px-5 py-3 text-xs font-bold text-ink-500">
              <span>세션명</span>
              <span className="text-right">가격</span>
              <span className="text-right">응답 시간</span>
              <span className="text-right">상태</span>
            </div>
            {products.length === 0 ? (
              <div className="px-5 py-5">
                <p className="text-sm font-bold text-ink-900">
                  등록된 슈퍼비전 방식이 없습니다.
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  오른쪽에서 세션명, 가격, 응답 시간을 등록하세요.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {products.map((product) => (
                  <details className="group" key={product.id}>
                    <summary className="cursor-pointer list-none px-5 py-4">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px_140px_100px] md:items-center">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge tone="neutral">
                              {productKindLabel(product.kind)}
                            </Badge>
                          </div>
                          <h2 className="truncate text-lg font-bold text-ink-900">
                            {product.title}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
                            {product.description ?? "설명 미등록"}
                          </p>
                        </div>
                        <p className="text-left text-lg font-bold text-ink-900 md:text-right">
                          {product.priceKrw.toLocaleString("ko-KR")}원
                        </p>
                        <p className="text-sm font-semibold text-ink-500 md:text-right">
                          {String(product.turnaroundHours ?? 72)}시간 이내
                        </p>
                        <div className="md:text-right">
                          <Badge tone={product.active ? "brand" : "neutral"}>
                            {product.active ? "공개 중" : "중지됨"}
                          </Badge>
                        </div>
                      </div>
                    </summary>
                    <div className="border-t border-line px-5 py-5">
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
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
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
