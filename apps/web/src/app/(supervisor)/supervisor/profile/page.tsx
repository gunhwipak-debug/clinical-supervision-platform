import Link from "next/link";
import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { SectionBlock } from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import {
  getDemoSupervisorProfile,
  isDemoUserId,
  listDemoSupervisorProducts,
  listDemoSupervisorQualifications,
  listDemoSupervisorSpecialties
} from "../../../../lib/demo/supervision";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";
import { SupervisorPageLoadError } from "../_components/supervisor-page-load-error";
import { SupervisorProfileEditor, SupervisorVisibilityForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function SupervisorProfilePage() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <LoginRequiredState title="슈퍼바이저 프로필" returnTo="/supervisor/profile" />
    );
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        currentUser={current.user}
        title="슈퍼바이저 프로필"
        description="프로필 관리는 슈퍼바이저 계정에서만 사용할 수 있습니다."
      />
    );
  }

  let profile: profiles.SupervisorProfile | null;
  let qualifications: profiles.Qualification[];
  let specialties: profiles.Specialty[];
  let products: profiles.Product[];

  try {
    const db = createRuntimeDatabase();
    profile = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.getSupervisorProfileByUserId(tx, current.session.userId)
    );
    [qualifications, specialties, products] = await Promise.all([
      withUserContext(
        db,
        { userId: current.session.userId, role: current.session.role },
        (tx) => profiles.listQualifications(tx, current.session.userId)
      ),
      withUserContext(
        db,
        { userId: current.session.userId, role: current.session.role },
        (tx) => profiles.listSelectedSpecialties(tx, current.session.userId)
      ),
      withUserContext(
        db,
        { userId: current.session.userId, role: current.session.role },
        (tx) => profiles.listProducts(tx, current.session.userId)
      )
    ]);
  } catch (error) {
    if (!isMissingDatabaseRelation(error) && !isDemoUserId(current.session.userId)) {
      console.error("[supervisor.profile.page]", error);
      return (
        <SupervisorPageLoadError
          active="supervisor-profile"
          currentUser={current.user}
          title="슈퍼바이저 프로필"
          subtitle="프로필 정보를 불러오는 동안 문제가 생겼습니다."
        />
      );
    }

    profile = null;
    qualifications = [];
    specialties = [];
    products = [];
  }
  if (isDemoUserId(current.session.userId)) {
    profile ??= getDemoSupervisorProfile(current.session.userId);
    if (qualifications.length === 0) {
      qualifications = listDemoSupervisorQualifications(current.session.userId);
    }
    if (specialties.length === 0) {
      specialties = listDemoSupervisorSpecialties(current.session.userId);
    }
    if (products.length === 0) {
      products = listDemoSupervisorProducts(current.session.userId);
    }
  }
  const canPublish = Boolean(
    profile && current.user.totpEnabled && profile.verificationStatus === "approved"
  );
  const publishBlockedReason = publishBlockReason({
    profile,
    totpEnabled: current.user.totpEnabled
  });

  return (
    <AppShell
      active="supervisor-profile"
      currentUser={current.user}
      title="슈퍼바이저 프로필"
      subtitle="신청자가 사진, 자격, 전문분야, 소개를 보고 자신에게 맞는 슈퍼바이저인지 판단할 수 있게 정리합니다."
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">업무 홈</Link>
        </Button>
      }
    >
      <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <SupervisorProfileEditor
          profile={profile}
          qualifications={qualifications}
          specialties={specialties}
          initialProducts={products}
        />

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <SectionBlock
            subtitle="자격 승인과 계정 확인이 완료되어야 공개 목록에 노출됩니다."
            title="공개 상태"
          >
            <SupervisorVisibilityForm
              canPublish={canPublish}
              initialVisibility={profile?.visibility ?? null}
              publishBlockedReason={publishBlockedReason}
            />
          </SectionBlock>
        </aside>
      </section>
    </AppShell>
  );
}

function publishBlockReason({
  profile,
  totpEnabled
}: {
  profile: profiles.SupervisorProfile | null;
  totpEnabled: boolean;
}): string | null {
  if (!profile) return "먼저 공개 표시명과 소개 정보를 저장해주세요.";
  if (!totpEnabled) return "검색 공개 전환 전에 계정 확인을 완료해주세요.";
  if (profile.verificationStatus !== "approved") {
    return "운영자가 자격 정보를 승인한 뒤 검색 공개로 전환할 수 있습니다.";
  }
  return null;
}
