import { audit, withUserContext } from "@csp/db";
import {
  AdminListFrame,
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
      <AdminShell title="감사 로그" subtitle="관리자 로그인이 필요합니다.">
        <AdminLockedState
          title="감사 로그는 관리자 로그인 후 확인합니다"
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
  const combinedLogs = [
    ...logs.auditLogs.map((row) => ({
      id: `audit-${row.id}`,
      kind: "관리자 조치",
      title: actionLabel(row.action),
      createdAt: row.createdAt,
      actor: row.actorUserId ? row.actorUserId.slice(0, 8) : "시스템",
      target: targetLabel(row.targetType, row.targetId),
      result: "기록됨",
      context: contextSummary(row.context)
    })),
    ...logs.accessLogs.map((row) => ({
      id: `access-${row.id}`,
      kind: "자료 접근",
      title: fileActionLabel(row.action),
      createdAt: row.createdAt,
      actor: row.userId.slice(0, 8),
      target: `파일 · ${row.fileId.slice(0, 8)}`,
      result: row.signedUrlId ? `링크 ${row.signedUrlId.slice(0, 8)}` : "기록됨",
      context: row.signedUrlId ? `접근 링크 ${row.signedUrlId.slice(0, 8)}` : ""
    }))
  ].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  return (
    <AdminShell
      currentAdmin={{ email: current.user.email }}
      currentPath="/admin/audit"
      title="감사 로그"
      subtitle="관리자 조치와 자료 접근 이력을 확인합니다."
    >
      <section className="grid gap-5">
        <AdminListFrame>
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="text-2xl font-bold text-ink-900">감사 로그 목록</h2>
            <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
              {logsUnavailable
                ? "데이터 준비 필요"
                : `${combinedLogs.length.toLocaleString("ko-KR")}건`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-sunken text-xs font-bold text-ink-500">
                <tr>
                  <th className="px-5 py-3">시간</th>
                  <th className="px-5 py-3">행위자</th>
                  <th className="px-5 py-3">작업</th>
                  <th className="px-5 py-3">대상</th>
                  <th className="px-5 py-3">결과</th>
                  <th className="px-5 py-3 text-right">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {combinedLogs.length === 0 ? (
                  <tr>
                    <td className="px-5 py-5 font-semibold text-ink-500" colSpan={6}>
                      감사 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  combinedLogs.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {row.actor}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-ink-900">{row.title}</p>
                        <p className="mt-1 text-xs font-semibold text-ink-500">
                          {row.kind}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {row.target}
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {row.result}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <details className="inline-block text-left">
                          <summary className="cursor-pointer list-none rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink-800">
                            상세 보기
                          </summary>
                          <p className="mt-3 w-80 rounded-xl border border-line bg-surface-elevated p-4 text-sm leading-relaxed text-ink-600 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                            {row.context || `${row.title} · ${row.target}`}
                          </p>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminListFrame>
      </section>
    </AdminShell>
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
  if (Number.isNaN(date.getTime())) return "날짜 미확인";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
