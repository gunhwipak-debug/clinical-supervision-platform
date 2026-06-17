import Link from "next/link";
import { AppShell } from "./app-shell";
import type { AppShellUser } from "./app-navigation";
import { Button } from "./ui/button";
import { EmptyState, FocusState } from "./ui/state";

export function LoginRequiredState({
  description = "계정으로 들어오면 진행 중인 슈퍼비전과 이어갈 일을 확인할 수 있습니다.",
  returnTo,
  title
}: {
  description?: string;
  returnTo: string;
  title: string;
}) {
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AppShell
      title={title}
      subtitle="이 화면은 로그인 후 실제 의뢰와 기록을 기준으로 표시됩니다."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <FocusState
          label="계정 확인"
          title="내 슈퍼비전 흐름으로 들어갑니다"
          description={description}
          action={
            <Button asChild variant="secondary">
              <Link href={loginHref as never}>로그인하기</Link>
            </Button>
          }
        />
        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-6 lg:sticky lg:top-28">
          <h2 className="text-xl font-bold text-ink-900">로그인 후 확인</h2>
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed">
            <div>
              <dt className="font-bold text-ink-500">진행 중인 의뢰</dt>
              <dd className="mt-1 text-ink-900">진행 상태와 이어갈 일</dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">사례 자료</dt>
              <dd className="mt-1 text-ink-900">업로드와 보완 요청</dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">학습 기록</dt>
              <dd className="mt-1 text-ink-900">완료된 슈퍼비전 기록</dd>
            </div>
          </dl>
        </aside>
      </div>
    </AppShell>
  );
}

export function RoleRequiredState({
  actionHref = "/requests",
  actionLabel = "내 의뢰 보기",
  currentUser,
  description,
  title
}: {
  actionHref?: string;
  actionLabel?: string;
  currentUser?: {
    email: AppShellUser["email"];
    role: AppShellUser["role"];
  };
  description: string;
  title: string;
}) {
  return (
    <AppShell
      {...(currentUser ? { currentUser } : {})}
      title={title}
      subtitle="현재 계정 권한으로는 이 작업을 진행할 수 없습니다."
    >
      <EmptyState
        title="접근할 수 없는 화면입니다"
        description={description}
        action={
          <Button asChild variant="secondary">
            <Link href={actionHref as never}>{actionLabel}</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
