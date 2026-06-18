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
import {
  getDemoSupervisorProfile,
  listDemoSupervisorAvailability,
  listDemoSupervisorProducts
} from "@/lib/demo/supervision";
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
      subtitle="슈퍼바이저와 슈퍼비전 방식을 확인하고 초안을 저장합니다. 화상 방식은 예약 시간을 함께 선택합니다."
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
  kind?: string | null;
  title: string;
  description: string | null;
  priceKrw: number;
  turnaroundHours: number | null;
};

async function loadSelectionSummary(
  supervisorId: string,
  serviceProductId: string
): Promise<{
  availability: profiles.PublicAvailabilitySlot[];
  availabilityExceptions: profiles.AvailabilityException[];
  productDescription: string | null;
  productKind: string | null;
  productPriceKrw: number | null;
  productTitle: string | null;
  productTurnaroundHours: number | null;
  supervisorName: string | null;
}> {
  if (!supervisorId || !serviceProductId) {
    return {
      availability: [],
      availabilityExceptions: [],
      productDescription: null,
      productKind: null,
      productPriceKrw: null,
      productTitle: null,
      productTurnaroundHours: null,
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
  const demoProfile = supervisor ? null : getDemoSupervisorProfile(supervisorId);
  const products = supervisor
    ? Array.isArray(supervisor.serviceProducts)
      ? (supervisor.serviceProducts as ProductSummary[])
      : []
    : listDemoSupervisorProducts(supervisorId);
  const selectedProduct = products.find((product) => product.id === serviceProductId);
  let availability: profiles.PublicAvailabilitySlot[] = [];
  let availabilityExceptions: profiles.AvailabilityException[] = [];

  if (supervisor) {
    try {
      availability = await profiles.listPublicAvailabilityForProfile(db, supervisor.id);
      availabilityExceptions =
        await profiles.listPublicAvailabilityExceptionsForProfile(db, supervisor.id);
    } catch (error) {
      if (!isMissingDatabaseRelation(error)) {
        throw error;
      }
      availabilityExceptions = [];
    }
  } else if (demoProfile) {
    availability = listDemoSupervisorAvailability(supervisorId);
  }

  return {
    availability,
    availabilityExceptions,
    productDescription: selectedProduct?.description ?? null,
    productKind: selectedProduct?.kind ?? null,
    productPriceKrw: selectedProduct?.priceKrw ?? null,
    productTitle: selectedProduct?.title ?? null,
    productTurnaroundHours: selectedProduct?.turnaroundHours ?? null,
    supervisorName: supervisor?.displayName ?? demoProfile?.displayName ?? null
  };
}
