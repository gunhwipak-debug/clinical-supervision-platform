import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { getCurrentUser } from "../lib/auth/current-user";
import { createRuntimeDatabase } from "../lib/auth/database";
import { isSupervisor } from "../lib/auth/guards";
import { contextFor } from "../lib/supervision/authz";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const current = await getCurrentUser();
  const requests = current
    ? await withUserContext(createRuntimeDatabase(), contextFor(current), (tx) =>
        supervision.listSupervisionRequests(tx)
      )
    : [];

  const sent = current
    ? requests.filter((request) => request.superviseeId === current.session.userId)
    : [];
  const received =
    current && isSupervisor(current)
      ? requests.filter((request) => request.supervisorId === current.session.userId)
      : [];
  const actionable = received.filter((request) =>
    [
      "accepted",
      "awaiting_supervisor_review",
      "feedback_submitted",
      "in_review"
    ].includes(request.status)
  );

  return (
    <main className="min-h-screen bg-surface-base text-ink-900">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-base/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link className="font-headline-md text-headline-md font-bold" href="/">
            ClinicFlow
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-semibold text-ink-700 md:flex">
            <Link href="/supervisors">슈퍼바이저 찾기</Link>
            <Link href="/requests">내 의뢰</Link>
            <Link href="/payments">결제</Link>
            <Link href="/resources">자료실</Link>
            {current && isSupervisor(current) ? (
              <Link href="/supervisor">슈퍼바이저 업무</Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-2">
            {current ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/settings">설정</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">가입</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1fr_420px] md:items-center md:py-20">
        <div className="grid gap-6">
          <Badge className="w-fit" tone="accent">
            임상 슈퍼비전 자료 검토 플랫폼
          </Badge>
          <div className="grid gap-4">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal md:text-6xl">
              민감한 임상자료를 안전하게 전달하고, 검토하고, 피드백까지 남깁니다.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-ink-700">
              슈퍼바이지는 필요한 슈퍼바이저와 일정을 선택해 의뢰하고, 슈퍼바이저는 받은
              자료를 웹에서 미리보기하며 주석과 피드백을 작성합니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={current ? "/requests" : "/signup"}>
                {current ? "내 의뢰 보기" : "계정 만들기"}
              </Link>
            </Button>
          </div>
        </div>

        <Card className="grid gap-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-500">
              {current ? "현재 작업" : "핵심 흐름"}
            </p>
            <span className="material-symbols-outlined text-brand-600">
              clinical_notes
            </span>
          </div>
          {current ? (
            <div className="grid gap-3">
              <StatusLink
                body={`${sent.length.toLocaleString("ko-KR")}건`}
                href="/requests"
                label="내가 전달한 자료"
              />
              {isSupervisor(current) ? (
                <StatusLink
                  body={`${actionable.length.toLocaleString("ko-KR")}건`}
                  href="/supervisor/requests"
                  label="검토해야 할 받은 자료"
                />
              ) : null}
              <StatusLink
                body="예약 가능한 전문가 검색"
                href="/supervisors"
                label="새 의뢰"
              />
            </div>
          ) : (
            <ol className="grid gap-3 text-sm text-ink-700">
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                1. 슈퍼바이저 프로필과 가능 일정을 확인합니다.
              </li>
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                2. 비식별화된 자료와 요청 내용을 제출합니다.
              </li>
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                3. 웹 미리보기에서 주석, 피드백, 완료 기록을 확인합니다.
              </li>
            </ol>
          )}
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-3">
        <FeatureCard
          body="슈퍼바이저별 가능시간과 구글 캘린더 바쁜 시간을 함께 반영해 예약 충돌을 줄입니다."
          icon="calendar_month"
          title="일정 동기화"
        />
        <FeatureCard
          body="보고서, 원자료, 축어록을 웹에서 미리보기하고 필요한 위치에 직접 주석을 남깁니다."
          icon="rate_review"
          title="자료 미리보기와 주석"
        />
        <FeatureCard
          body="의뢰, 결제, 환불, 정산, 완료 기록을 상태 흐름에 맞춰 추적합니다."
          icon="verified_user"
          title="업무 기록"
        />
      </section>
    </main>
  );
}

function StatusLink({
  body,
  href,
  label
}: {
  body: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="flex items-center justify-between rounded-md border border-line bg-surface-sunken p-3 transition hover:bg-surface-elevated"
      href={href as never}
    >
      <span>
        <span className="block text-sm font-semibold text-ink-500">{label}</span>
        <span className="block text-lg font-bold text-ink-900">{body}</span>
      </span>
      <span className="material-symbols-outlined text-brand-600">arrow_forward</span>
    </Link>
  );
}

function FeatureCard({
  body,
  icon,
  title
}: {
  body: string;
  icon: string;
  title: string;
}) {
  return (
    <Card className="grid gap-3">
      <span className="material-symbols-outlined text-3xl text-brand-600">{icon}</span>
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      <p className="text-sm leading-relaxed text-ink-600">{body}</p>
    </Card>
  );
}
