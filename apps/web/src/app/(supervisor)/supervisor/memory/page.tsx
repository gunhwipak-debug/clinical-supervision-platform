import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import {
  PrimaryActionPanel,
  SectionBlock
} from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../../lib/auth/database";

export const dynamic = "force-dynamic";

export default async function SupervisorMemoryPage() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return (
      <AppShell
        active="supervisor"
        title="슈퍼비전 노트"
        subtitle="슈퍼바이저 계정으로 로그인해야 사용할 수 있습니다."
      >
        <EmptyState
          title="로그인이 필요합니다"
          description="반복되는 슈퍼비전 맥락과 완료 기록은 슈퍼바이저 계정에서 확인합니다."
        />
      </AppShell>
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

  return (
    <AppShell
      active="supervisor"
      title="슈퍼비전 노트"
      subtitle="완료된 피드백과 진행 중인 사례 맥락을 한 화면에서 접어 보고, 다음 검토로 돌아갑니다."
      action={
        <Button asChild>
          <Link href="/supervisor/requests">의뢰 큐 보기</Link>
        </Button>
      }
    >
      <PrimaryActionPanel title="노트는 업무를 대신하지 않고, 검토 맥락을 줄여줍니다">
        같은 슈퍼바이지의 반복 의뢰, 자주 보완되는 자료, 완료된 피드백을 빠르게 찾는
        용도입니다. 실제 작성과 제출은 각 의뢰 상세에서 진행합니다.
      </PrimaryActionPanel>

      <SectionBlock title="상태별 폴더">
        <div className="grid gap-3">
          {folders.length === 0 ? (
            <Card className="text-sm text-ink-500">
              아직 표시할 슈퍼비전 기록이 없습니다.
            </Card>
          ) : (
            folders.map((folder) => (
              <details
                className="rounded-xl border border-line bg-surface-elevated p-5 shadow-card"
                key={folder.label}
                open
              >
                <summary className="cursor-pointer text-lg font-bold text-ink-900">
                  {folder.label}
                  <span className="ml-2 text-sm font-semibold text-ink-500">
                    {folder.items.length.toLocaleString("ko-KR")}건
                  </span>
                </summary>
                <div className="mt-4 grid gap-2 border-l border-line pl-4">
                  {folder.items.map((request) => (
                    <Link
                      className="grid gap-1 rounded-lg px-3 py-3 hover:bg-surface-sunken"
                      href={`/supervisor/requests/${request.id}`}
                      key={request.id}
                    >
                      <span className="font-bold text-ink-900">
                        ㄴ {request.productTitle ?? "슈퍼비전 의뢰"}
                      </span>
                      <span className="text-sm text-ink-500">
                        {formatDate(request.updatedAt)} · 보관 {request.retentionDays}일
                      </span>
                    </Link>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </SectionBlock>
    </AppShell>
  );
}

function groupByStatus(
  items: Awaited<ReturnType<typeof supervision.listSupervisionRequests>>
) {
  const order = [
    ["검토 중", ["awaiting_supervisor_review", "accepted", "in_review"]],
    ["보완 요청", ["additional_info_requested"]],
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
