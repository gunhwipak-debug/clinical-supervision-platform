import Link from "next/link";
import type { ReactNode } from "react";
import { profiles, withUserContext } from "@csp/db";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  ShieldCheck,
  User,
  UserRoundCog
} from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { SupervisorProfileForm, SupervisorVisibilityForm } from "./profile-form";

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
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link aria-label="대시보드" href="/supervisor">
            <ArrowLeft aria-hidden className="text-ink-900" size={28} />
          </Link>
          <h1 className="text-2xl font-bold">수퍼바이저 프로필</h1>
          <Eye aria-hidden className="text-ink-700" size={26} />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-6">
        <ProfilePreviewCard
          canPublish={canPublish}
          profile={profile}
          products={products}
          qualifications={qualifications}
          specialties={specialties}
        />

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">공개 프로필 초안</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  검색 카드와 상세 페이지에 노출되는 핵심 문구입니다. 저장 후 위
                  미리보기에서 실제 공개 모습을 확인하세요.
                </p>
              </div>
              <Badge tone={canPublish ? "brand" : "neutral"}>
                {canPublish ? "공개 가능" : "공개 조건 미충족"}
              </Badge>
            </div>
            <SupervisorProfileForm profile={profile} />
          </Card>

          <div className="grid gap-4">
            <InfoCard
              icon={<Eye aria-hidden size={21} />}
              title="노출 기준"
              body="공개 전환은 2FA와 승인 자격이 모두 충족될 때만 가능합니다."
            />
            <InfoCard
              icon={<ShieldCheck aria-hidden size={21} />}
              title="작성 톤"
              body="공개 소개에는 내담자 식별 가능 정보가 들어가면 안 됩니다."
            />
            <Card className="rounded-3xl border-line bg-surface-elevated p-5 shadow-card">
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

function ProfilePreviewCard({
  canPublish,
  products,
  profile,
  qualifications,
  specialties
}: {
  canPublish: boolean;
  products: profiles.Product[];
  profile: profiles.SupervisorProfile | null;
  qualifications: profiles.Qualification[];
  specialties: profiles.Specialty[];
}) {
  const approvedQualifications = qualifications.filter(
    (qualification) => qualification.status === "approved"
  );
  const activeProducts = products.filter((product) => product.active);
  const isPublic =
    profile?.visibility === "public" && profile.verificationStatus === "approved";

  return (
    <Card className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
        <div className="text-center">
          <div className="mx-auto grid size-28 place-items-center overflow-hidden rounded-full border border-line bg-brand-50 text-brand-600">
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${profile.displayName} 프로필 사진`}
                className="h-full w-full object-cover"
                src={profile.photoUrl}
              />
            ) : (
              <UserRoundCog aria-hidden size={42} />
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge tone={visibilityTone(profile?.visibility ?? "hidden")}>
              {visibilityLabel(profile?.visibility ?? "hidden")}
            </Badge>
            <Badge tone={verificationTone(profile?.verificationStatus ?? "pending")}>
              {verificationLabel(profile?.verificationStatus ?? "pending")}
            </Badge>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {profile?.displayName ?? "프로필 이름을 저장해주세요"}
                </h2>
                {profile?.verificationStatus === "approved" ? (
                  <CheckCircle2 aria-hidden className="text-brand-600" size={22} />
                ) : null}
              </div>
              <p className="mt-2 text-lg text-ink-700">
                {profile?.headline ?? "검색 결과에 표시될 한 줄 소개가 필요합니다."}
              </p>
            </div>
            {isPublic ? (
              <Link
                className="inline-flex items-center justify-center rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-surface-sunken"
                href={`/supervisors/${profile.id}`}
              >
                공개 페이지 보기
              </Link>
            ) : null}
          </div>
          <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
            {profile?.bio ?? "상세 소개를 저장하면 공개 상세 페이지에 표시됩니다."}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <PreviewMetric
              label="경력"
              value={
                profile?.yearsOfExperience !== null &&
                profile?.yearsOfExperience !== undefined
                  ? `${String(profile.yearsOfExperience)}년`
                  : "미등록"
              }
            />
            <PreviewMetric
              label="공개 상품"
              value={`${String(activeProducts.length)}개`}
            />
            <PreviewMetric label="평점" value={profile?.averageRating ?? "신규"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {approvedQualifications.length > 0 ? (
              approvedQualifications.slice(0, 3).map((qualification) => (
                <Badge key={qualification.id} tone="brand">
                  {qualification.name}
                </Badge>
              ))
            ) : (
              <Badge tone={canPublish ? "neutral" : "danger"}>
                승인된 자격 정보 없음
              </Badge>
            )}
            {specialties.length > 0 ? (
              specialties.slice(0, 4).map((specialty) => (
                <Badge key={specialty.id} tone="neutral">
                  {specialty.labelKo}
                </Badge>
              ))
            ) : (
              <Badge tone="neutral">전문분야 미등록</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-base p-3">
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink-900">{value}</p>
    </div>
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
  if (!totpEnabled) return "검색 공개 전환 전에 2단계 인증을 설정해주세요.";
  if (profile.verificationStatus !== "approved") {
    return "운영자가 자격 정보를 승인한 뒤 검색 공개로 전환할 수 있습니다.";
  }
  return null;
}

function visibilityLabel(visibility: profiles.SupervisorProfile["visibility"]): string {
  const labels = {
    hidden: "비공개",
    private: "제한 공개",
    public: "검색 공개"
  } satisfies Record<profiles.SupervisorProfile["visibility"], string>;
  return labels[visibility];
}

function visibilityTone(
  visibility: profiles.SupervisorProfile["visibility"]
): "brand" | "accent" | "neutral" | "danger" {
  if (visibility === "public") return "brand";
  if (visibility === "private") return "accent";
  return "neutral";
}

function verificationLabel(
  status: profiles.SupervisorProfile["verificationStatus"]
): string {
  const labels = {
    approved: "자격 승인됨",
    pending: "자격 검토 대기",
    rejected: "자격 반려",
    revoked: "승인 철회"
  } satisfies Record<profiles.SupervisorProfile["verificationStatus"], string>;
  return labels[status];
}

function verificationTone(
  status: profiles.SupervisorProfile["verificationStatus"]
): "brand" | "accent" | "neutral" | "danger" {
  if (status === "approved") return "brand";
  if (status === "rejected" || status === "revoked") return "danger";
  return "neutral";
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
    <Card className="rounded-3xl border-line bg-surface-elevated p-5 shadow-card">
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
            { href: "/supervisor", label: "대시보드", icon: ClipboardList },
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
