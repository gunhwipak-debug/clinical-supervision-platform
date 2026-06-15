import type { ReactNode } from "react";
import { audit, withUserContext } from "@csp/db";
import { Eye, FileClock, ShieldCheck } from "lucide-react";
import {
  AdminCard,
  AdminLockedState,
  AdminShell
} from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="처리 기록" subtitle="관리자 로그인이 필요합니다.">
        <AdminLockedState
          title="처리 기록은 관리자 로그인 후 확인합니다"
          description="운영 조치와 자료 접근 기록을 필요한 범위 안에서 다시 확인하는 화면입니다."
          returnPath="/admin/audit"
          previewItems={[
            "관리자 조치 기록",
            "자료 접근 기록",
            "운영 확인을 위한 검색과 필터"
          ]}
        />
      </AdminShell>
    );
  }

  let logs: {
    accessLogs: Awaited<ReturnType<typeof audit.listAccessLogs>>;
    auditLogs: Awaited<ReturnType<typeof audit.listAuditLogs>>;
  };
  let logsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    logs = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: "admin",
        adminReason: "운영 처리 기록 조회를 위한 처리 사유입니다."
      },
      async (tx) => ({
        accessLogs: await audit.listAccessLogs(tx, { limit: 80 }),
        auditLogs: await audit.listAuditLogs(tx, { limit: 80 })
      })
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[admin.audit.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    logs = {
      accessLogs: [],
      auditLogs: []
    };
    logsUnavailable = true;
  }

  return (
    <AdminShell
      currentAdmin={{ email: current.user.email }}
      currentPath="/admin/audit"
      title="처리 기록"
      subtitle="관리자 조치와 자료 접근 이력을 필요한 범위 안에서 다시 확인합니다."
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminCard>
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <FileClock aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">운영 추적 상태</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                관리자 조치와 자료 접근 이력을 함께 확인합니다. 사례 자료 본문은 이
                화면에 노출하지 않습니다.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>
              관리자 조치{" "}
              {logsUnavailable
                ? "확인 필요"
                : `${logs.auditLogs.length.toLocaleString("ko-KR")}건`}
            </Badge>
            <Badge>
              자료 접근{" "}
              {logsUnavailable
                ? "확인 필요"
                : `${logs.accessLogs.length.toLocaleString("ko-KR")}건`}
            </Badge>
          </div>
        </AdminCard>

        <AdminCard className="h-fit">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <ShieldCheck aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">조회 원칙</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                최근 기록만 확인하고, 필요한 경우에만 접근 링크와 처리 사유를 다시
                대조합니다.
              </p>
            </div>
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-2xl font-bold text-ink-900">관리자 조치 기록</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              승인, 반려, 접근 링크 발급, 운영 조회 같은 관리자 행위입니다.
            </p>
          </div>
          <div className="grid divide-y divide-line">
            {logs.auditLogs.length === 0 ? (
              <EmptyLog
                message={
                  logsUnavailable
                    ? "현재 관리자 조치 기록을 불러오지 못했습니다."
                    : "표시할 관리자 조치 기록이 없습니다."
                }
              />
            ) : (
              logs.auditLogs.map((row) => (
                <article className="grid gap-3 p-5" key={row.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-lg text-ink-900">
                      {actionLabel(row.action)}
                    </strong>
                    <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                      {formatDate(row.createdAt)}
                    </span>
                  </div>
                  <dl className="grid gap-2 text-sm text-ink-700">
                    <LogItem
                      label="대상"
                      value={targetLabel(row.targetType, row.targetId)}
                    />
                    <LogItem
                      label="관리자"
                      value={row.actorUserId ? row.actorUserId.slice(0, 8) : "시스템"}
                    />
                    <LogItem label="사유" value={row.reason ?? "사유 없음"} />
                  </dl>
                  {contextSummary(row.context) ? (
                    <p className="rounded-lg bg-surface-sunken px-4 py-3 text-xs leading-relaxed text-ink-500">
                      {contextSummary(row.context)}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-2xl font-bold text-ink-900">자료 접근 기록</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              파일 미리보기, 다운로드, 업로드, 삭제 이력을 확인합니다.
            </p>
          </div>
          <div className="grid divide-y divide-line">
            {logs.accessLogs.length === 0 ? (
              <EmptyLog
                message={
                  logsUnavailable
                    ? "현재 자료 접근 기록을 불러오지 못했습니다."
                    : "표시할 자료 접근 기록이 없습니다."
                }
              />
            ) : (
              logs.accessLogs.map((row) => (
                <article className="grid gap-3 p-5" key={row.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2">
                      <Eye aria-hidden className="text-brand-600" size={18} />
                      <strong className="text-lg text-ink-900">
                        {fileActionLabel(row.action)}
                      </strong>
                    </span>
                    <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                      {formatDate(row.createdAt)}
                    </span>
                  </div>
                  <dl className="grid gap-2 text-sm text-ink-700">
                    <LogItem label="파일" value={row.fileId.slice(0, 8)} />
                    <LogItem label="사용자" value={row.userId.slice(0, 8)} />
                    <LogItem
                      label="접근 링크"
                      value={row.signedUrlId ? row.signedUrlId.slice(0, 8) : "없음"}
                    />
                  </dl>
                </article>
              ))
            )}
          </div>
        </AdminCard>
      </section>
    </AdminShell>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600">
      {children}
    </span>
  );
}

function EmptyLog({ message }: { message: string }) {
  return <p className="p-6 text-sm font-semibold text-ink-500">{message}</p>;
}

function LogItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-brand-50 px-4 py-3">
      <dt className="shrink-0 font-semibold text-ink-500">{label}</dt>
      <dd className="min-w-0 break-all text-right font-semibold text-ink-900">
        {value}
      </dd>
    </div>
  );
}

function actionLabel(value: string): string {
  const labels: Record<string, string> = {
    signed_url_issue: "접근 링크 발급"
  };
  return labels[value] ?? value;
}

function fileActionLabel(value: string): string {
  const labels: Record<string, string> = {
    delete: "삭제",
    download: "다운로드",
    upload: "업로드",
    view: "미리보기"
  };
  return labels[value] ?? value;
}

function targetLabel(type: string | null, id: string | null): string {
  if (!type && !id) return "없음";
  return `${type ?? "대상"} · ${id ? id.slice(0, 8) : "ID 없음"}`;
}

function contextSummary(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => typeof entryValue !== "object")
    .slice(0, 4)
    .map(([key, entryValue]) => `${key}: ${String(entryValue)}`);
  return entries.join(" · ");
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
