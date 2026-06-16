import { AppShell } from "../../../../components/app-shell";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { profiles } from "@csp/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
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
  const currentShellUser = current.user;

  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
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
      active="request-new"
      currentUser={current.user}
      title="새 슈퍼비전 의뢰"
      subtitle="슈퍼바이저, 세션, 일정을 확인하고 초안을 저장합니다."
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
  let supervisor: Awaited<ReturnType<typeof profiles.getPublicSupervisorDetails>>;
  try {
    supervisor = await profiles.getPublicSupervisorDetails(db, supervisorId);
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[supervisee.requests-new.selection.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    supervisor = null;
  }
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
