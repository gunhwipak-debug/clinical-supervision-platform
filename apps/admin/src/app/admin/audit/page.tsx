import type { ReactNode } from "react";
import { audit, withUserContext } from "@csp/db";
import { ArrowLeft, Eye, FileClock, ShieldCheck } from "lucide-react";
import { AdminCard, AdminShell } from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="감사 로그" subtitle="관리자 로그인이 필요합니다.">
        <AdminCard>관리자 계정으로 로그인해주세요.</AdminCard>
      </AdminShell>
    );
  }

  const db = createRuntimeDatabase();
  const logs = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 감사 로그 조회를 위한 관리자 사유입니다."
    },
    async (tx) => ({
      accessLogs: await audit.listAccessLogs(tx, { limit: 80 }),
      auditLogs: await audit.listAuditLogs(tx, { limit: 80 })
    })
  );

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-5 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a aria-label="관리자 대시보드" href="/admin">
            <ArrowLeft aria-hidden className="text-ink-700" size={30} />
          </a>
          <h1 className="text-2xl font-bold">감사 로그</h1>
          <ShieldCheck aria-hidden className="text-ink-700" size={26} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7">
        <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <FileClock aria-hidden size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold">운영 추적 상태</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  관리자 조치와 자료 접근 이력을 함께 확인합니다. 본문 PHI는 이 화면에
                  노출하지 않습니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>
                관리자 조치 {logs.auditLogs.length.toLocaleString("ko-KR")}건
              </Badge>
              <Badge>
                자료 접근 {logs.accessLogs.length.toLocaleString("ko-KR")}건
              </Badge>
            </div>
          </div>
        </AdminCard>

        <section className="grid gap-6 xl:grid-cols-2">
          <AdminCard className="rounded-3xl border-line bg-surface-elevated p-0 shadow-card">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-xl font-bold">관리자 조치 로그</h2>
              <p className="mt-1 text-sm text-ink-500">
                승인, 반려, URL 발급, 운영 조회 같은 관리자 행위입니다.
              </p>
            </div>
            <div className="grid divide-y divide-line">
              {logs.auditLogs.length === 0 ? (
                <EmptyLog message="표시할 관리자 조치 로그가 없습니다." />
              ) : (
                logs.auditLogs.map((row) => (
                  <article className="grid gap-3 p-5" key={row.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong className="text-lg text-ink-900">
                        {actionLabel(row.action)}
                      </strong>
                      <span className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
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
                      <p className="rounded-2xl bg-surface-sunken px-4 py-3 text-xs leading-relaxed text-ink-500">
                        {contextSummary(row.context)}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </AdminCard>

          <AdminCard className="rounded-3xl border-line bg-surface-elevated p-0 shadow-card">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-xl font-bold">자료 접근 로그</h2>
              <p className="mt-1 text-sm text-ink-500">
                파일 미리보기, 다운로드, 업로드, 삭제 이력을 확인합니다.
              </p>
            </div>
            <div className="grid divide-y divide-line">
              {logs.accessLogs.length === 0 ? (
                <EmptyLog message="표시할 자료 접근 로그가 없습니다." />
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
                      <span className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                        {formatDate(row.createdAt)}
                      </span>
                    </div>
                    <dl className="grid gap-2 text-sm text-ink-700">
                      <LogItem label="파일" value={row.fileId.slice(0, 8)} />
                      <LogItem label="사용자" value={row.userId.slice(0, 8)} />
                      <LogItem
                        label="서명 URL"
                        value={row.signedUrlId ? row.signedUrlId.slice(0, 8) : "없음"}
                      />
                    </dl>
                  </article>
                ))
              )}
            </div>
          </AdminCard>
        </section>
      </div>
    </main>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600">
      {children}
    </span>
  );
}

function EmptyLog({ message }: { message: string }) {
  return <p className="p-6 text-sm font-semibold text-ink-500">{message}</p>;
}

function LogItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-brand-50 px-4 py-3">
      <dt className="shrink-0 font-semibold text-ink-500">{label}</dt>
      <dd className="min-w-0 break-all text-right font-semibold text-ink-900">
        {value}
      </dd>
    </div>
  );
}

function actionLabel(value: string): string {
  const labels: Record<string, string> = {
    signed_url_issue: "서명 URL 발급"
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
