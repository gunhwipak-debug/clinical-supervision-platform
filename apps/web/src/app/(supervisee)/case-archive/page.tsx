import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { FlowStepNav, SectionBlock } from "../../../components/clinicflow-shell";
import { AppShell } from "../../../components/app-shell";
import { Button } from "../../../components/ui/button";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../components/locked-state";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { listDemoSuperviseeRequests } from "../../../lib/demo/supervision";
import { isSupervisee } from "../../../lib/auth/guards";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";
import { contextFor } from "../../../lib/supervision/authz";

export const dynamic = "force-dynamic";

type RequestSummary = supervision.SupervisionRequestSummary;

const flowSteps = [
  "슈퍼바이저 선택",
  "상품 선택",
  "일정 선택",
  "사례자료 정리",
  "답변 확인",
  "결제",
  "수락 대기"
];

export default async function CaseArchivePage() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="케이스 아카이브" returnTo="/case-archive" />;
  }
  const currentShellUser = current.user;
  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="케이스 아카이브"
        description="완료된 슈퍼비전 기록은 신청자 계정에서 확인합니다. 슈퍼바이저는 업무 화면에서 검토 기록을 확인합니다."
        actionHref="/supervisor"
        actionLabel="슈퍼바이저 업무 보기"
      />
    );
  }

  let requests: RequestSummary[];
  let archiveUnavailable = false;
  try {
    requests = await withUserContext(
      createRuntimeDatabase(),
      contextFor(current),
      (tx) => supervision.listSupervisionRequests(tx)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[supervisee.case-archive.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    requests = listDemoSuperviseeRequests(current.session.userId);
    archiveUnavailable = requests.length === 0;
  }
  const own = requests.filter(
    (request) => request.superviseeId === current.session.userId
  );
  const completed = own.filter((request) =>
    ["feedback_submitted", "completion_record_issued", "completed"].includes(
      request.status
    )
  );
  const folders = groupBySupervisor(completed);

  return (
    <AppShell
      active="case-archive"
      currentUser={current.user}
      title="케이스 아카이브"
      subtitle="완료된 슈퍼비전 기록과 피드백을 슈퍼바이저와 사례 단위로 다시 확인합니다."
      action={
        <Button asChild>
          <Link href="/supervisors">새 슈퍼비전 시작</Link>
        </Button>
      }
    >
      <FlowStepNav current="수락 대기" steps={flowSteps} />
      {completed.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <SectionBlock
            title="슈퍼바이저별 기록"
            subtitle="슈퍼바이저 이름을 열고, 그 아래 사례별 기록을 바로 확인합니다."
          >
            <div className="rounded-xl border border-dashed border-line bg-surface-elevated px-5 py-6">
              <p className="text-lg font-bold text-ink-900">
                {archiveUnavailable
                  ? "현재 학습 기록 폴더를 불러오지 못했습니다"
                  : "아직 열린 학습 기록 폴더가 없습니다"}
              </p>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                {archiveUnavailable
                  ? "연결이 복구되면 슈퍼바이저별 폴더와 사례 기록이 이곳에 표시됩니다."
                  : "피드백이 완료되면 슈퍼바이저별 폴더 아래에 사례 기록이 표시됩니다."}
              </p>
            </div>
          </SectionBlock>
          <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-ink-900">선택한 기록</h2>
            <div className="mt-5 grid gap-4 text-sm">
              <ArchiveSummaryLine
                label="현재 폴더"
                value={archiveUnavailable ? "확인 필요" : "기록 없음"}
              />
              <ArchiveSummaryLine
                label="주요 내용"
                value={
                  archiveUnavailable
                    ? "기록 연결 상태를 확인한 뒤 다시 표시됩니다."
                    : "피드백 완료 후 선택할 기록이 생깁니다."
                }
              />
              {!archiveUnavailable ? (
                <Button asChild className="mt-2 w-full" variant="secondary">
                  <Link href="/requests">내 의뢰 보기</Link>
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-6">
            <SectionBlock
              title="슈퍼바이저별 기록"
              subtitle="슈퍼바이저 이름을 열고, 그 아래 사례별 기록을 바로 확인합니다."
            >
              <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
                {folders.map((folder) => (
                  <details
                    className="border-b border-line px-5 py-5 last:border-b-0"
                    key={folder.supervisor}
                    open
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-2xl font-bold tracking-tight text-ink-900">
                            {folder.supervisor}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {folder.items[0]?.productTitle ?? "슈퍼비전 기록"} ·{" "}
                            {folder.items.length.toLocaleString("ko-KR")}건
                          </p>
                        </div>
                        <span className="rounded-full bg-surface-sunken px-3 py-1 text-sm font-semibold text-ink-700">
                          {folder.items.length.toLocaleString("ko-KR")}건
                        </span>
                      </div>
                    </summary>
                    <div className="mt-5 border-l border-line pl-4">
                      {folder.items.map((request) => (
                        <Link
                          className="grid gap-2 border-b border-line py-4 transition last:border-b-0 hover:bg-surface-sunken"
                          href={`/requests/${request.id}`}
                          key={request.id}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-lg font-bold text-ink-900">
                              {archiveCaseTitle(request)}
                            </span>
                            <span className="text-sm font-semibold text-brand-700">
                              {statusLabel(request.status)}
                            </span>
                          </div>
                          <span className="text-sm leading-relaxed text-ink-500">
                            {archiveCaseSummary(request)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </SectionBlock>
          </div>

          <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-ink-900">선택한 기록</h2>
            <div className="mt-5 grid gap-4 text-sm">
              <ArchiveSummaryLine
                label="현재 폴더"
                value={`${folders[0]?.supervisor ?? "기록 없음"} · ${archiveCaseTitle(folders[0]?.items[0] ?? null)}`}
              />
              <ArchiveSummaryLine
                label="주요 내용"
                value={archiveCaseSummary(folders[0]?.items[0] ?? null)}
              />
              <ArchiveSummaryLine
                label="다시 볼 때"
                value="슈퍼바이저 이름으로 먼저 찾고, 사례명을 열어 필요한 기록만 확인합니다."
              />
              <Button asChild className="mt-2 w-full" variant="secondary">
                <Link
                  href={
                    folders[0]?.items[0]
                      ? `/requests/${folders[0].items[0].id}`
                      : "/requests"
                  }
                >
                  기록 열기
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function groupBySupervisor(items: RequestSummary[]) {
  const map = new Map<string, RequestSummary[]>();
  for (const item of items) {
    const key = item.supervisorDisplayName ?? "슈퍼바이저 미지정";
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()].map(([supervisor, folderItems]) => ({
    supervisor,
    items: folderItems
  }));
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    feedback_submitted: "피드백 도착",
    completion_record_issued: "이수 기록 발급됨",
    completed: "완료됨"
  };
  return labels[status] ?? "기록 보관";
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function archiveCaseTitle(request: RequestSummary | null): string {
  if (!request) return "기록 없음";
  return request.productTitle ?? "슈퍼비전 기록";
}

function archiveCaseSummary(request: RequestSummary | null): string {
  if (!request) return "선택된 기록이 없습니다.";
  return `${statusLabel(request.status)} · ${formatDate(request.updatedAt)}`;
}

function ArchiveSummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-900">{value}</span>
    </div>
  );
}
