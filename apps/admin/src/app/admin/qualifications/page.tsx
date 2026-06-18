import type { ReactNode } from "react";
import { decryptPhi } from "@csp/shared/crypto/phi";
import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import { Search } from "lucide-react";
import { AdminActionPanel } from "../../../components/admin-action-panel";
import {
  AdminDarkPanel,
  AdminListFrame,
  AdminLockedState,
  AdminShell
} from "../../../components/admin-shell";
import { AdminDownloadLink } from "../../../components/admin-download-link";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";

export const dynamic = "force-dynamic";

type QualificationQueueItem = {
  id: string;
  name: string;
  number: string | null;
  issuingBody: string | null;
  issuedAt: Date | string | null;
  expiresAt: Date | string | null;
  evidenceFileId: string | null;
  evidenceOriginalFilename: string | null;
  evidenceMimeType: string | null;
  evidenceSizeBytes: number | null;
  evidenceUploadedAt: Date | string | null;
  evidenceVirusScanStatus: "clean" | "infected" | "error" | null;
  createdAt: Date | string;
  status: "approved" | "pending" | "rejected";
  supervisorName: string;
  supervisorHeadline: string | null;
};

type QueueDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export default async function AdminQualificationsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const current = await getCurrentAdmin();
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const query = (params.q ?? "").trim();

  if (!current) {
    return (
      <AdminShell title="자격 승인" subtitle="관리자 로그인과 2단계 인증이 필요합니다.">
        <AdminLockedState
          title="슈퍼바이저 자격 검토는 관리자 전용입니다"
          description="공개 목록에 오르기 전 자격 증빙, 전문 분야, 심사 상태를 확인합니다."
          returnPath="/admin/qualifications"
          previewItems={[
            "제출된 자격 증빙과 발급 기관",
            "승인, 반려, 추가 확인 상태",
            "공개 프로필 반영 여부"
          ]}
        />
      </AdminShell>
    );
  }

  let allItems: QualificationQueueItem[];
  let qualificationsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    allItems = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: "admin",
        adminReason: "운영 자격 심사 조회를 위한 처리 사유입니다.",
        phiAccess: true
      },
      (tx) => listQualifications(tx)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[admin.qualifications.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    allItems = [];
    qualificationsUnavailable = true;
  }
  const queue = allItems.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (!query ||
        [item.supervisorName, item.name, item.issuingBody ?? ""].some((value) =>
          value.toLowerCase().includes(query.toLowerCase())
        ))
  );
  const firstPendingItem = queue.find((item) => item.status === "pending") ?? queue[0];

  return (
    <AdminShell
      currentAdmin={{ email: current.user.email }}
      currentPath="/admin/qualifications"
      eyebrow="심사 대기"
      primaryAction={{
        href: firstPendingItem
          ? `#qualification-${firstPendingItem.id}`
          : "#qualification-list",
        label: firstPendingItem ? "첫 심사 열기" : "심사 목록 보기"
      }}
      title="자격 심사"
      subtitle="슈퍼바이저 자격 증빙과 공개 조건을 검토합니다."
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4">
          <form
            action="/admin/qualifications"
            className="flex min-h-14 items-center gap-4 rounded-full border border-line bg-surface-elevated px-5 text-ink-500"
          >
            <Search aria-hidden size={20} />
            <input name="status" type="hidden" value={status} />
            <label className="sr-only" htmlFor="qualification-search">
              신청자, 자격명, 발급기관 검색
            </label>
            <input
              className="min-w-0 flex-1 bg-transparent py-4 text-base text-ink-900 outline-none placeholder:text-ink-500"
              defaultValue={query}
              id="qualification-search"
              name="q"
              placeholder="신청자, 자격명, 발급기관 검색"
            />
            <button
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"
              type="submit"
            >
              검색
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <a
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  tab.value === status
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-line bg-surface-elevated text-ink-700 hover:bg-surface-sunken"
                }`}
                href={qualificationHref(tab.value, query)}
                key={tab.value}
              >
                {tab.label}
              </a>
            ))}
          </div>

          <AdminListFrame id="qualification-list">
            {queue.length === 0 ? (
              <p className="px-6 py-8 text-sm font-semibold text-ink-500">
                {qualificationsUnavailable
                  ? "현재 자격 신청을 불러오지 못했습니다. 제출된 자격 증빙과 공개 조건은 연결되면 이 목록에 표시됩니다."
                  : "조건에 맞는 자격 신청이 등록되면 이곳에 표시됩니다."}
              </p>
            ) : (
              <div className="grid divide-y divide-line">
                {queue.map((item) => (
                  <article
                    className="grid gap-5 px-6 py-6"
                    id={`qualification-${item.id}`}
                    key={item.id}
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_88px_auto] md:items-start">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-400">
                          {item.evidenceFileId ? "자격 심사" : "증빙 자료"}
                        </p>
                        <h2 className="mt-3 break-keep text-[32px] font-bold leading-tight text-ink-900">
                          {item.name}
                        </h2>
                        <p className="mt-4 break-keep text-base leading-8 text-ink-700">
                          {item.supervisorName} ·{" "}
                          {item.issuingBody ?? "발급기관 확인 필요"} ·{" "}
                          {item.supervisorHeadline ?? "공개 소개 문구 확인 필요"}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-400">
                          {formatDate(item.createdAt)} 제출
                        </p>
                      </div>
                      <strong className="pt-1 text-base font-bold text-ink-900">
                        운영자
                      </strong>
                      <StatusPill status={item.status}>
                        {qualificationStatusCallout(item.status)}
                      </StatusPill>
                    </div>

                    <dl className="grid gap-3 border-t border-line pt-5 text-sm text-ink-700 md:grid-cols-2">
                      <div>
                        <dt className="font-bold text-ink-900">자격번호</dt>
                        <dd className="mt-1">{item.number ?? "미입력"}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-ink-900">유효기간</dt>
                        <dd className="mt-1">
                          {formatFullDate(item.issuedAt) ?? "발급일 없음"} -{" "}
                          {formatFullDate(item.expiresAt) ?? "만료일 없음"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold text-ink-900">검토 대상</dt>
                        <dd className="mt-1">
                          자격 증빙 · 공개 프로필 · 전문분야 일치 여부
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold text-ink-900">증빙 파일</dt>
                        <dd className="mt-1 flex flex-wrap items-center gap-2">
                          {item.evidenceFileId && item.evidenceOriginalFilename ? (
                            <>
                              <AdminDownloadLink
                                filename={item.evidenceOriginalFilename}
                                url={`/api/admin/qualification-evidence/${item.evidenceFileId}/download`}
                              />
                              <span>
                                {item.evidenceMimeType ?? "형식 확인 필요"} ·{" "}
                                {formatBytes(item.evidenceSizeBytes)}
                              </span>
                              <span>
                                {qualificationEvidenceStatusLabel(
                                  item.evidenceVirusScanStatus
                                )}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-danger">
                              증빙 파일 없음
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    {item.status === "pending" ? (
                      <AdminActionPanel
                        actions={[
                          {
                            label: "승인",
                            tone: "primary",
                            url: `/api/admin/qualifications/${item.id}/approve`,
                            ...(item.evidenceFileId &&
                            item.evidenceVirusScanStatus === "clean"
                              ? {}
                              : {
                                  disabledReason:
                                    "검토 가능한 증빙이 있어야 승인할 수 있습니다."
                                })
                          },
                          {
                            label: "반려",
                            tone: "secondary",
                            url: `/api/admin/qualifications/${item.id}/reject`
                          }
                        ]}
                        reasonPlaceholder="예: 제출된 자격 증빙, 발급기관, 프로필 기재 내용을 확인했고 승인/반려합니다."
                      />
                    ) : (
                      <p className="rounded-2xl bg-surface-sunken px-4 py-3 text-sm text-ink-600">
                        이미 {qualificationStatusLabel(item.status)} 처리된 자격입니다.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </AdminListFrame>
        </div>

        <AdminDarkPanel
          title="심사 기준"
          description="공개 프로필에 표시될 자격, 전문분야, 소개 문구가 제출 증빙과 맞는지 확인합니다."
          className="h-fit lg:sticky lg:top-8"
        >
          <dl className="grid gap-4 border-t border-line pt-6 text-sm leading-7 text-ink-600">
            <div>
              <dt className="font-semibold text-ink-900">표시 중</dt>
              <dd className="mt-1">
                {qualificationsUnavailable
                  ? "연결 대기"
                  : `${queue.length.toLocaleString("ko-KR")}건`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-900">현재 필터</dt>
              <dd className="mt-1 break-keep">
                {statusTabs.find((tab) => tab.value === status)?.label ?? "대기 중"}
                {query ? ` · 검색어 "${query}"` : ""}
              </dd>
            </div>
          </dl>
        </AdminDarkPanel>
      </section>
    </AdminShell>
  );
}

function StatusPill({
  children,
  status
}: {
  children: ReactNode;
  status: QualificationQueueItem["status"];
}) {
  const statusClassName =
    status === "pending"
      ? "border-[#f3cf85] text-[#cb6f12]"
      : status === "approved"
        ? "border-brand-200 text-brand-700"
        : "border-line text-ink-500";

  return (
    <span
      className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${statusClassName}`}
    >
      {children}
    </span>
  );
}

function qualificationStatusCallout(status: QualificationQueueItem["status"]): string {
  const labels = {
    approved: "검토 완료",
    pending: "심사 필요",
    rejected: "재확인 필요"
  } satisfies Record<QualificationQueueItem["status"], string>;
  return labels[status];
}

const statusTabs = [
  { label: "전체보기", value: "all" },
  { label: "대기 중", value: "pending" },
  { label: "승인됨", value: "approved" },
  { label: "반려됨", value: "rejected" }
] as const;

type QualificationStatusFilter = (typeof statusTabs)[number]["value"];

function normalizeStatus(value: string | undefined): QualificationStatusFilter {
  return statusTabs.some((tab) => tab.value === value)
    ? (value as QualificationStatusFilter)
    : "pending";
}

function qualificationHref(status: QualificationStatusFilter, query: string): string {
  const params = new URLSearchParams();
  params.set("status", status);
  if (query) params.set("q", query);
  return `/admin/qualifications?${params.toString()}`;
}

function qualificationStatusLabel(status: QualificationQueueItem["status"]): string {
  const labels = {
    approved: "승인됨",
    pending: "대기 중",
    rejected: "반려됨"
  } satisfies Record<QualificationQueueItem["status"], string>;
  return labels[status];
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatFullDate(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatBytes(value: number | null): string {
  if (!value) return "크기 확인 필요";
  if (value < 1024 * 1024) return `${String(Math.round(value / 102.4) / 10)}KB`;
  return `${String(Math.round(value / 1024 / 102.4) / 10)}MB`;
}

function qualificationEvidenceStatusLabel(
  status: QualificationQueueItem["evidenceVirusScanStatus"]
): string {
  const labels = {
    clean: "악성 파일 검사 통과",
    error: "파일 검사 오류",
    infected: "악성 파일 의심"
  } satisfies Record<
    NonNullable<QualificationQueueItem["evidenceVirusScanStatus"]>,
    string
  >;
  return status ? labels[status] : "검사 상태 확인 필요";
}

async function listQualifications(db: QueueDatabase) {
  const result = await db.execute(sql`
    select
      q.id,
      q.name,
      case
        when q.number_enc is null
          or nullif(current_setting('app.phi_key', true), '') is null
        then null
        else ${decryptPhi(sql`q.number_enc`)}
      end as "number",
      q.issuing_body as "issuingBody",
      q.issued_at as "issuedAt",
      q.expires_at as "expiresAt",
      q.evidence_file_id as "evidenceFileId",
      ef.original_filename as "evidenceOriginalFilename",
      ef.mime_type as "evidenceMimeType",
      ef.size_bytes as "evidenceSizeBytes",
      ef.uploaded_at as "evidenceUploadedAt",
      ef.virus_scan_status as "evidenceVirusScanStatus",
      q.created_at as "createdAt",
      q.status,
      sp.display_name as "supervisorName",
      sp.headline as "supervisorHeadline"
    from qualifications q
    join supervisor_profiles sp on sp.id = q.supervisor_profile_id
    left join qualification_evidence_files ef on ef.id = q.evidence_file_id
    order by q.created_at asc
  `);
  return rowsOf<QualificationQueueItem>(result);
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }
  return [];
}
