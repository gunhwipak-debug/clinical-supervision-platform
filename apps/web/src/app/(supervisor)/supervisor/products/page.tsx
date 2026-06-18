import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { SectionBlock } from "../../../../components/clinicflow-shell";
import { Badge } from "../../../../components/ui/badge";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import {
  isDemoUserId,
  listDemoSupervisorProducts
} from "../../../../lib/demo/supervision";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";
import {
  displaySupervisionMethodDescription,
  displaySupervisionMethodName,
  durationMinutesForProduct,
  feedbackDeadlineLabel,
  standardSupervisionMethodCodes,
  supervisionMethodByKind
} from "../../../../lib/supervision-method-catalog";
import { SupervisorPageLoadError } from "../_components/supervisor-page-load-error";
import { ProductCatalogForm, ProductManageForm } from "./product-form";

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
    if (!isMissingDatabaseRelation(error) && !isDemoUserId(current.session.userId)) {
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
  if (products.length === 0 && isDemoUserId(current.session.userId)) {
    products = listDemoSupervisorProducts(current.session.userId);
  }

  const standardProducts = products.filter((product) =>
    standardSupervisionMethodCodes.has(product.kind)
  );
  const legacyProducts = products.filter(
    (product) => !standardSupervisionMethodCodes.has(product.kind)
  );
  const activeProducts = standardProducts.filter((product) => product.active);

  return (
    <AppShell
      active="supervisor-products"
      currentUser={current.user}
      title="슈퍼비전 방식"
      subtitle="ClinicFlow가 제공하는 표준 방식 중 신청 받을 항목과 가격, 제공 조건을 설정합니다."
    >
      <section className="grid gap-6">
        <SectionBlock
          subtitle={`${String(activeProducts.length)}개 방식이 신청자에게 보입니다.`}
          title="제공할 방식 선택"
        >
          <ProductCatalogForm products={products} />
        </SectionBlock>

        {standardProducts.length > 0 ? (
          <SectionBlock title="현재 신청 가능한 방식">
            <div className="overflow-hidden rounded-lg border border-line bg-surface-elevated">
              <div className="grid grid-cols-[minmax(0,1fr)_120px_152px_100px] gap-4 border-b border-line bg-surface-sunken px-5 py-3 text-xs font-bold text-ink-500">
                <span>방식</span>
                <span className="text-right">가격</span>
                <span className="text-right">제공 조건</span>
                <span className="text-right">상태</span>
              </div>
              <div className="divide-y divide-line">
                {standardProducts.map((product) => {
                  const method = supervisionMethodByKind(product.kind);
                  return (
                    <div
                      className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_152px_100px] md:items-center"
                      key={product.id}
                    >
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">
                            {method?.deliveryMode === "live_video" ? "화상" : "서면"}
                          </Badge>
                        </div>
                        <h2 className="truncate text-lg font-bold text-ink-900">
                          {displaySupervisionMethodName(product)}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
                          {displaySupervisionMethodDescription(product)}
                        </p>
                      </div>
                      <p className="text-left text-lg font-bold text-ink-900 md:text-right">
                        {product.priceKrw.toLocaleString("ko-KR")}원
                      </p>
                      <p className="text-sm font-semibold text-ink-500 md:text-right">
                        {method?.deliveryMode === "live_video"
                          ? `${String(durationMinutesForProduct(product) ?? 90)}분`
                          : feedbackDeadlineLabel(product.turnaroundHours)}
                      </p>
                      <div className="md:text-right">
                        <Badge tone={product.active ? "brand" : "neutral"}>
                          {product.active ? "신청 가능" : "숨김"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionBlock>
        ) : null}

        {legacyProducts.length > 0 ? (
          <SectionBlock
            subtitle="표준 catalog로 옮기기 전 기존 데이터입니다. 결제·의뢰 연결을 보존하기 위해 삭제하지 않습니다."
            title="기존 방식 보존"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-surface-elevated">
              <div className="divide-y divide-line">
                {legacyProducts.map((product) => (
                  <details className="group" key={product.id}>
                    <summary className="cursor-pointer list-none px-5 py-4">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center">
                        <div>
                          <Badge tone="neutral">기존 방식</Badge>
                          <h2 className="mt-2 text-lg font-bold text-ink-900">
                            {displaySupervisionMethodName(product)}
                          </h2>
                          <p className="mt-1 text-sm leading-relaxed text-ink-500">
                            {displaySupervisionMethodDescription(product)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-ink-900 md:text-right">
                          {product.priceKrw.toLocaleString("ko-KR")}원
                        </p>
                        <div className="md:text-right">
                          <Badge tone={product.active ? "brand" : "neutral"}>
                            {product.active ? "신청 가능" : "숨김"}
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
            </div>
          </SectionBlock>
        ) : null}
      </section>
    </AppShell>
  );
}
