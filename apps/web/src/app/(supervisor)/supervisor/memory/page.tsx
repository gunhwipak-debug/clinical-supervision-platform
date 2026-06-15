import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { SectionBlock } from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../../lib/auth/database";

export const dynamic = "force-dynamic";

export default async function SupervisorMemoryPage() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="기록 폴더" returnTo="/supervisor/memory" />;
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        title="기록 폴더"
        description="기록 폴더는 슈퍼바이저 계정에서만 확인합니다."
      />
    );
  }

  const requests = await withUserContext(
    createRuntimeDatabase(),
    { userId: current.session.userId, role: current.session.role },
    (tx) => supervision.listSupervisionRequests(tx)
  );
  const assigned = requests.filter(
    (request) => request.supervisorId === current.session.userId
  );
  const folders = groupByStatus(assigned);
  const selectedFolder = folders[0] ?? null;
  const selectedRecord = selectedFolder?.items[0] ?? null;

  return (
    <AppShell
      active="supervisor"
      title="기록 폴더"
      subtitle="완료된 피드백과 진행 중인 사례 맥락을 접어 보고, 다음 검토로 돌아갑니다."
      action={
        <Button asChild>
          <Link href="/supervisor/requests">검토할 의뢰 보기</Link>
        </Button>
      }
    >
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SectionBlock
          subtitle="슈퍼바이저별 폴더를 열고, 그 아래 사례별 피드백과 완료 기록을 한 줄씩 확인합니다."
          title="상태별 폴더"
        >
          <div className="grid gap-3">
            {folders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-elevated px-5 py-6 text-sm text-ink-500">
                아직 표시할 슈퍼비전 기록이 없습니다.
              </div>
            ) : (
              folders.map((folder, folderIndex) => (
                <details
                  className="overflow-hidden rounded-xl border border-line bg-surface-elevated"
                  key={folder.label}
                  open={folderIndex === 0}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-5">
                    <div>
                      <span className="text-lg font-bold text-ink-900">
                        {folder.label}
                      </span>
                      <p className="mt-1 text-sm text-ink-500">
                        {folderDescription(folder.label)}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-500">
                      {folder.items.length.toLocaleString("ko-KR")}건
                    </span>
                  </summary>
                  <div className="border-t border-line">
                    {folder.items.map((request) => (
                      <article
                        className="grid gap-4 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                        key={request.id}
                      >
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-ink-900">
                            {request.productTitle ?? "슈퍼비전 의뢰"}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-ink-500">
                            {memoryDescription(request.status)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-ink-500">
                            <span className="rounded-full bg-surface-sunken px-3 py-2">
                              {memoryStatusLabel(request.status)}
                            </span>
                            <span className="rounded-full bg-surface-sunken px-3 py-2">
                              {formatDate(request.updatedAt)}
                            </span>
                            <span className="rounded-full bg-surface-sunken px-3 py-2">
                              보관 {request.retentionDays}일
                            </span>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/supervisor/requests/${request.id}`}>
                            기록 열기
                          </Link>
                        </Button>
                      </article>
                    ))}
                  </div>
                </details>
              ))
            )}
          </div>
        </SectionBlock>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <p className="text-sm font-bold text-brand-700">선택한 기록</p>
          <h2 className="mt-2 text-xl font-bold text-ink-900">
            {selectedRecord?.productTitle ?? "아직 열린 기록이 없습니다"}
          </h2>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine
              label="현재 폴더"
              value={selectedFolder?.label ?? "표시할 폴더 없음"}
            />
            <SummaryLine
              label="상태"
              value={
                selectedRecord ? memoryStatusLabel(selectedRecord.status) : "기록 없음"
              }
            />
            <SummaryLine
              label="최근 변경"
              value={
                selectedRecord ? formatDate(selectedRecord.updatedAt) : "기록 없음"
              }
            />
            <SummaryLine
              label="보관 기간"
              value={
                selectedRecord
                  ? `${String(selectedRecord.retentionDays)}일`
                  : "기록 없음"
              }
            />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-500">
            슈퍼바이저 이름 대신 상태와 최근 변경 시점으로 먼저 찾고, 필요한 경우에만
            의뢰 상세로 돌아가 검토 문맥을 이어갑니다.
          </p>
          {selectedRecord ? (
            <div className="mt-5">
              <Button asChild variant="secondary">
                <Link href={`/supervisor/requests/${selectedRecord.id}`}>
                  기록 열기
                </Link>
              </Button>
            </div>
          ) : null}
        </aside>
      </section>
    </AppShell>
  );
}

function groupByStatus(
  items: Awaited<ReturnType<typeof supervision.listSupervisionRequests>>
) {
  const order = [
    ["검토 중", ["awaiting_supervisor_review", "accepted", "in_review"]],
    ["추가 자료 요청", ["additional_info_requested"]],
    ["피드백 완료", ["feedback_submitted", "completion_record_issued", "completed"]],
    ["닫힌 의뢰", ["rejected", "cancelled", "refunded", "expired"]]
  ] as const;

  return order
    .map(([label, statuses]) => ({
      label,
      items: items.filter((item) =>
        (statuses as readonly string[]).includes(item.status)
      )
    }))
    .filter((folder) => folder.items.length > 0);
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-900">{value}</span>
    </div>
  );
}

function folderDescription(label: string): string {
  if (label === "검토 중") return "현재 진행 중인 검토와 이어서 볼 메모입니다.";
  if (label === "추가 자료 요청")
    return "보완 자료를 기다리거나 다시 확인할 기록입니다.";
  if (label === "피드백 완료") return "완료된 피드백과 학습 기록을 다시 열어봅니다.";
  return "닫힌 의뢰를 상태 확인용으로만 보관합니다.";
}

function memoryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    awaiting_supervisor_review: "수락 대기",
    accepted: "검토 준비",
    in_review: "검토 진행 중",
    additional_info_requested: "보완 자료 요청",
    feedback_submitted: "피드백 완료",
    completion_record_issued: "학습 기록 발급",
    completed: "완료",
    rejected: "반려",
    cancelled: "취소",
    refunded: "환불",
    expired: "만료"
  };
  return labels[status] ?? status;
}

function memoryDescription(status: string): string {
  if (status === "awaiting_supervisor_review") {
    return "수락 여부를 판단하기 위해 다시 열 수 있는 의뢰입니다.";
  }
  if (status === "accepted" || status === "in_review") {
    return "사례 자료와 메모를 이어서 검토하는 중입니다.";
  }
  if (status === "additional_info_requested") {
    return "보완 자료가 도착하면 다시 확인할 기록입니다.";
  }
  if (status === "feedback_submitted" || status === "completion_record_issued") {
    return "피드백과 학습 기록을 다시 확인할 수 있습니다.";
  }
  if (status === "completed") return "완료 후 보관 중인 검토 기록입니다.";
  return "닫힌 요청 기록입니다.";
}
