import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import {
  FlowStepNav,
  PrimaryActionPanel,
  SectionBlock
} from "../../../components/clinicflow-shell";
import { AppShell } from "../../../components/app-shell";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/state";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { isSupervisee } from "../../../lib/auth/guards";
import { contextFor } from "../../../lib/supervision/authz";

export const dynamic = "force-dynamic";

type RequestSummary = supervision.SupervisionRequestSummary;

const flowSteps = [
  "슈퍼바이저 선택",
  "세션 선택",
  "자료 제출",
  "슈퍼비전",
  "피드백",
  "학습 기록"
];

export default async function CaseArchivePage() {
  const current = await getCurrentUser();

  if (!current || !isSupervisee(current)) {
    return (
      <AppShell
        active="case-archive"
        title="학습 기록"
        subtitle="완료된 슈퍼비전 기록은 로그인 후 확인할 수 있습니다."
      >
        <EmptyState
          title="로그인이 필요합니다"
          description="내 슈퍼비전 기록을 보려면 먼저 로그인하세요."
          action={
            <Button asChild>
              <Link href="/login">로그인</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const requests = await withUserContext(
    createRuntimeDatabase(),
    contextFor(current),
    (tx) => supervision.listSupervisionRequests(tx)
  );
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
      title="학습 기록"
      subtitle="완료된 슈퍼비전은 파일 목록이 아니라 슈퍼바이저와 사례 단위의 노트처럼 정리됩니다."
      action={
        <Button asChild>
          <Link href="/supervisors">새 슈퍼비전 시작</Link>
        </Button>
      }
    >
      <FlowStepNav current="학습 기록" steps={flowSteps} />
      {completed.length === 0 ? (
        <EmptyState
          title="아직 보관된 학습 기록이 없습니다"
          description="피드백을 받은 의뢰가 완료되면 이곳에 슈퍼바이저별 폴더로 표시됩니다."
          action={
            <Button asChild>
              <Link href="/requests">내 의뢰 보기</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6">
          <PrimaryActionPanel title="필요한 기록을 슈퍼바이저별로 접어 봅니다">
            기록이 많아질수록 목록형 파일함보다 폴더형 구조가 찾기 쉽습니다. 각
            슈퍼바이저 아래에 사례별 피드백과 완료 기록이 쌓입니다.
          </PrimaryActionPanel>
          <SectionBlock title="슈퍼비전 노트">
            <div className="grid gap-3">
              {folders.map((folder) => (
                <details
                  className="rounded-xl border border-line bg-surface-elevated p-5 shadow-card"
                  key={folder.supervisor}
                  open
                >
                  <summary className="cursor-pointer text-lg font-bold text-ink-900">
                    {folder.supervisor}
                    <span className="ml-2 text-sm font-semibold text-ink-500">
                      {folder.items.length.toLocaleString("ko-KR")}건
                    </span>
                  </summary>
                  <div className="mt-4 grid gap-2 border-l border-line pl-4">
                    {folder.items.map((request) => (
                      <Link
                        className="grid gap-1 rounded-lg px-3 py-3 hover:bg-surface-sunken"
                        href={`/requests/${request.id}`}
                        key={request.id}
                      >
                        <span className="font-bold text-ink-900">
                          ㄴ {request.productTitle ?? "슈퍼비전 기록"}
                        </span>
                        <span className="text-sm text-ink-500">
                          {statusLabel(request.status)} · {formatDate(request.updatedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </SectionBlock>
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
