import type { ReactNode } from "react";
import { decryptPhi } from "@csp/shared/crypto/phi";
import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import { FileCheck2, Menu, Search, ShieldCheck } from "lucide-react";
import { AdminActionPanel } from "../../../components/admin-action-panel";
import { AdminCard, AdminShell } from "../../../components/admin-shell";
import { AdminDownloadLink } from "../../../components/admin-download-link";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";

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
        <AdminCard>관리자 계정으로 로그인해주세요.</AdminCard>
      </AdminShell>
    );
  }

  const db = createRuntimeDatabase();
  const allItems = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 자격 승인 큐 조회를 위한 관리자 사유입니다.",
      phiAccess: true
    },
    (tx) => listQualifications(tx)
  );
  const queue = allItems.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (!query ||
        [item.supervisorName, item.name, item.issuingBody ?? ""].some((value) =>
          value.toLowerCase().includes(query.toLowerCase())
        ))
  );

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-6 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="inline-flex items-center gap-3">
            <Menu aria-hidden size={28} />
            <span className="text-3xl font-bold">ClinicFlow 운영</span>
          </span>
          <span className="rounded-pill bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            자격 심사
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
        <section>
          <h1 className="text-4xl font-bold">자격 관리</h1>
          <p className="mt-3 text-xl text-ink-700">
            슈퍼바이저 신청 내역을 검토하고 승인하세요.
          </p>
        </section>

        <form
          action="/admin/qualifications"
          className="flex h-16 items-center gap-4 rounded-2xl border border-line bg-surface-elevated px-5 text-xl text-ink-500 shadow-card"
        >
          <Search aria-hidden size={30} />
          <input name="status" type="hidden" value={status} />
          <input
            className="min-w-0 flex-1 bg-transparent text-xl text-ink-900 outline-none placeholder:text-ink-500"
            defaultValue={query}
            name="q"
            placeholder="신청자, 자격명, 발급기관 검색"
          />
          <button
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white"
            type="submit"
          >
            검색
          </button>
        </form>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {statusTabs.map((tab) => (
            <a
              className={`shrink-0 rounded-full border px-6 py-3 text-lg font-medium ${
                tab.value === status
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-line bg-surface-elevated text-ink-700"
              }`}
              href={qualificationHref(tab.value, query)}
              key={tab.value}
            >
              {tab.label}
            </a>
          ))}
        </div>

        <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <ShieldCheck aria-hidden size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold">자격 검증 목록</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  자격번호는 공개 화면에 노출하지 않고 운영자 검증 목적으로만 다룹니다.
                </p>
              </div>
            </div>
            <BadgePill>표시 중 {String(queue.length)}건</BadgePill>
          </div>
        </AdminCard>

        <section className="grid gap-4">
          {queue.length === 0 ? (
            <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
              <strong className="text-xl text-ink-900">
                표시할 자격 신청이 없습니다
              </strong>
              <p className="mt-1 text-sm text-ink-500">
                조건에 맞는 자격 신청이 등록되면 이곳에 표시됩니다.
              </p>
            </AdminCard>
          ) : (
            queue.map((item) => (
              <AdminCard
                key={item.id}
                className="grid gap-4 rounded-3xl border-line bg-surface-elevated p-6 shadow-card"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <FileCheck2 aria-hidden size={22} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-500">
                        {formatDate(item.createdAt)} 제출
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-ink-900">
                        {item.supervisorName}
                      </h2>
                      <p className="mt-1 text-lg text-ink-700">{item.name}</p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">
                        {item.issuingBody ?? "발급기관 미입력"} ·{" "}
                        {item.supervisorHeadline ?? "슈퍼바이저 한줄 소개가 없습니다."}
                      </p>
                      <dl className="mt-4 grid gap-3 rounded-2xl bg-surface-sunken p-4 text-sm text-ink-700 md:grid-cols-2">
                        <div>
                          <dt className="font-bold text-ink-900">자격번호</dt>
                          <dd>{item.number ?? "미입력"}</dd>
                        </div>
                        <div>
                          <dt className="font-bold text-ink-900">유효기간</dt>
                          <dd>
                            {formatFullDate(item.issuedAt) ?? "발급일 없음"} -{" "}
                            {formatFullDate(item.expiresAt) ?? "만료일 없음"}
                          </dd>
                        </div>
                        <div className="md:col-span-2">
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
                    </div>
                  </div>
                  <BadgePill>{qualificationStatusLabel(item.status)}</BadgePill>
                </div>
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
              </AdminCard>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function BadgePill({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600">
      {children}
    </span>
  );
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
