import { AppShell } from "../../../../components/app-shell";
import { EmptyState } from "../../../../components/ui/state";
import { profiles } from "@csp/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { NewRequestForm } from "./new-request-form";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{
    productId?: string;
    serviceProductId?: string;
    slot?: string;
    slotEnd?: string;
    slotId?: string;
    slotStart?: string;
    supervisorId?: string;
  }>;
}) {
  const params = await searchParams;
  const current = await getCurrentUser();
  if (!current) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo(params))}`);
  }

  if (!isSupervisee(current)) {
    return (
      <AppShell
        title="새 슈퍼비전 의뢰"
        subtitle="슈퍼비전 의뢰는 슈퍼바이지 계정에서 진행합니다."
      >
        <EmptyState
          title="의뢰를 만들 수 없습니다"
          description="관리자 계정은 운영 콘솔에서만 사용할 수 있습니다."
        />
      </AppShell>
    );
  }

  const serviceProductId = params.serviceProductId ?? params.productId ?? "";
  const selection = await loadSelectionSummary(
    params.supervisorId ?? "",
    serviceProductId
  );

  return (
    <AppShell
      title="새 슈퍼비전 의뢰"
      subtitle="상품과 희망 일정을 확인한 뒤 초안을 만들고, 자료 제출과 선택 점검을 이어갑니다."
    >
      <NewRequestForm
        serviceProductId={serviceProductId}
        selectedSlotEnd={params.slotEnd ?? ""}
        selectedSlotStart={params.slotStart ?? ""}
        selectedSlot={params.slot ?? params.slotId ?? ""}
        selection={selection}
      />
    </AppShell>
  );
}

type ProductSummary = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  priceKrw: number;
};

async function loadSelectionSummary(
  supervisorId: string,
  serviceProductId: string
): Promise<{
  productDescription: string | null;
  productKind: string | null;
  productPriceKrw: number | null;
  productTitle: string | null;
  supervisorName: string | null;
}> {
  if (!supervisorId || !serviceProductId) {
    return {
      productDescription: null,
      productKind: null,
      productPriceKrw: null,
      productTitle: null,
      supervisorName: null
    };
  }

  const db = createRuntimeDatabase();
  const supervisor = await profiles.getPublicSupervisorDetails(db, supervisorId);
  const products = Array.isArray(supervisor?.serviceProducts)
    ? (supervisor.serviceProducts as ProductSummary[])
    : [];
  const selectedProduct = products.find((product) => product.id === serviceProductId);

  return {
    productDescription: selectedProduct?.description ?? null,
    productKind: selectedProduct?.kind ?? null,
    productPriceKrw: selectedProduct?.priceKrw ?? null,
    productTitle: selectedProduct?.title ?? null,
    supervisorName: supervisor?.displayName ?? null
  };
}

function returnTo(params: {
  productId?: string;
  serviceProductId?: string;
  slot?: string;
  slotEnd?: string;
  slotId?: string;
  slotStart?: string;
  supervisorId?: string;
}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const suffix = query.toString();
  return suffix ? `/requests/new?${suffix}` : "/requests/new";
}
