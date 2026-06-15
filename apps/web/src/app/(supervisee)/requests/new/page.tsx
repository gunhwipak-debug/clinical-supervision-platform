import { AppShell } from "../../../../components/app-shell";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { profiles } from "@csp/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
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
    return <LoginRequiredState title="새 슈퍼비전 의뢰" returnTo="/requests/new" />;
  }

  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        title="새 슈퍼비전 의뢰"
        description="새 의뢰는 신청자 계정에서 진행합니다. 슈퍼바이저 계정은 업무 화면에서 배정된 의뢰를 검토합니다."
        actionHref="/supervisor"
        actionLabel="슈퍼바이저 업무 보기"
      />
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
      subtitle="슈퍼바이저, 세션, 일정을 확인한 뒤 사례 자료를 정리하고 최종 확인으로 이어갑니다."
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
