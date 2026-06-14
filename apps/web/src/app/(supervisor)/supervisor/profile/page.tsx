import Link from "next/link";
import type { ReactNode } from "react";
import { profiles, withUserContext } from "@csp/db";
import {
  CalendarClock,
  ClipboardList,
  ShieldCheck,
  User
} from "lucide-react";
import { SiteHeader } from "../../../../components/clinicflow-shell";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { SupervisorProfileEditor, SupervisorVisibilityForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function SupervisorProfilePage() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return (
      <main className="min-h-screen bg-surface-base p-6 text-ink-900">
        <EmptyState
          title="슈퍼바이저 로그인이 필요합니다"
          description="공개 프로필을 작성하려면 슈퍼바이저 계정으로 로그인하세요."
        />
      </main>
    );
  }

  const db = createRuntimeDatabase();
  const profile = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.getSupervisorProfileByUserId(tx, current.session.userId)
  );
  const [qualifications, specialties, products] = await Promise.all([
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
  const canPublish = Boolean(
    profile && current.user.totpEnabled && profile.verificationStatus === "approved"
  );
  const publishBlockedReason = publishBlockReason({
    profile,
    totpEnabled: current.user.totpEnabled
  });

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <SiteHeader
        active="supervisor"
        actionHref="/supervisor/requests"
        actionLabel="의뢰 큐"
      />

      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-6">
        <section className="grid gap-5 lg:grid-cols-1">
          <div className="w-full">
            <SupervisorProfileEditor
              profile={profile}
              qualifications={qualifications}
              specialties={specialties}
              initialProducts={products}
            />
          </div>

          <div className="grid gap-4">
            <InfoCard
              icon={<ShieldCheck aria-hidden size={21} />}
              title="공개 전 확인"
              body="자격 승인과 계정 확인이 완료되어야 공개 목록에 노출됩니다. 소개에는 식별 가능한 사례 정보를 적지 마세요."
            />
            <Card className="rounded-xl border-line bg-surface-elevated p-5 shadow-card">
              <SupervisorVisibilityForm
                canPublish={canPublish}
                initialVisibility={profile?.visibility ?? null}
                publishBlockedReason={publishBlockedReason}
              />
            </Card>
          </div>
        </section>
      </div>

      <SupervisorBottomNav active="프로필" />
    </main>
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

function InfoCard({
  icon,
  title,
  body
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-xl border-line bg-surface-elevated p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div>
          <h2 className="font-bold text-ink-900">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{body}</p>
        </div>
      </div>
    </Card>
  );
}

function SupervisorBottomNav({ active }: { active: string }) {
  return (
    <nav className="border-t border-line bg-surface-elevated px-4 py-3">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 text-center text-sm font-medium text-ink-700">
        {(
          [
            { href: "/supervisor", label: "업무 홈", icon: ClipboardList },
            { href: "/supervisor/requests", label: "의뢰 검토", icon: ShieldCheck },
            {
              href: "/supervisor/availability",
              label: "일정",
              icon: CalendarClock
            },
            { href: "/supervisor/profile", label: "프로필", icon: User }
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
