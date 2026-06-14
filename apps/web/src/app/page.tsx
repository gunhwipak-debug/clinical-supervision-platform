import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  FlowStepNav,
  PageIntro,
  PrimaryActionPanel,
  SiteHeader
} from "../components/clinicflow-shell";
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
      <SiteHeader active="" actionHref="/supervisors" actionLabel="시작하기" />

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1fr_420px] md:items-center md:py-20">
        <div className="grid gap-6">
          <Badge className="w-fit" tone="accent">
            온라인 임상 슈퍼비전
          </Badge>
          <PageIntro
            title="슈퍼바이저를 찾고, 사례를 제출하고, 피드백을 학습 기록으로 남깁니다."
            subtitle="ClinicFlow는 병원과 센터 실무자가 슈퍼비전을 의뢰하고, 받은 피드백을 이후 학습에 다시 꺼내볼 수 있게 돕는 온라인 교육 플랫폼입니다."
          />
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

        <Card className="grid gap-4 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-500">
              {current ? "이어갈 작업" : "진행 흐름"}
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
                body="예약 가능한 슈퍼바이저 검색"
                href="/supervisors"
                label="새 의뢰"
              />
            </div>
          ) : (
            <ol className="grid gap-3 text-sm text-ink-700">
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                1. 슈퍼바이저의 사진, 자격, 전문 분야, 소개를 확인합니다.
              </li>
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                2. 세션 유형과 일정을 고른 뒤 사례 자료를 제출합니다.
              </li>
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                3. 피드백과 보완 요청을 확인하고 학습 기록으로 보관합니다.
              </li>
            </ol>
          )}
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16">
        <FlowStepNav
          current="슈퍼바이저 선택"
          steps={[
            "슈퍼바이저 선택",
            "세션 선택",
            "일정 선택",
            "자료 제출",
            "피드백 확인",
            "학습 기록"
          ]}
        />
        <PrimaryActionPanel
          action={
            <Button asChild className="bg-white text-ink-900 hover:bg-slate-100">
              <Link href="/guide">진행 방식 보기</Link>
            </Button>
          }
          title="처음이라면 슈퍼바이저 선택부터 시작하세요"
        >
          가격표를 먼저 보는 구조가 아니라, 내 사례에 맞는 슈퍼바이저와 슈퍼비전 방식을
          고른 뒤 필요한 자료를 제출하는 흐름입니다.
        </PrimaryActionPanel>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-3">
        <FeatureCard
          body="프로필에서 자격, 전문 분야, 소개, 제공 항목을 함께 보고 선택합니다."
          icon="calendar_month"
          title="슈퍼바이저 비교"
        />
        <FeatureCard
          body="주호소, 의뢰 사유, 검사자료, 확인받고 싶은 질문을 한 흐름에서 정리합니다."
          icon="rate_review"
          title="사례 자료 제출"
        />
        <FeatureCard
          body="완료된 슈퍼비전은 슈퍼바이저와 사례 단위의 학습 기록으로 다시 확인합니다."
          icon="verified_user"
          title="피드백 보관"
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
