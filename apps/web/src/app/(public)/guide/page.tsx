import Link from "next/link";
import {
  FlowStepNav,
  PageIntro,
  PrimaryActionPanel,
  SectionBlock,
  SiteHeader
} from "../../../components/clinicflow-shell";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

const flowSteps = [
  "슈퍼바이저 선택",
  "세션 선택",
  "일정 선택",
  "사례 자료 업로드",
  "확인·결제",
  "수락 대기",
  "슈퍼비전·검토",
  "피드백 확인",
  "학습 기록"
];

const workflowCards = [
  {
    title: "1. 슈퍼바이저를 고릅니다",
    body: "사진, 자격, 전문 분야, 자기소개를 보고 내 사례에 맞는 슈퍼바이저를 비교합니다."
  },
  {
    title: "2. 세션과 일정을 선택합니다",
    body: "화상 슈퍼비전, 비동기 코멘트, 보고서 검토처럼 필요한 방식을 선택합니다."
  },
  {
    title: "3. 사례 자료를 올립니다",
    body: "주호소, 의뢰 사유, 확인받고 싶은 질문, 검토 자료를 한곳에 정리합니다."
  },
  {
    title: "4. 결제 후 수락을 기다립니다",
    body: "슈퍼바이저가 자료와 일정을 확인한 뒤 수락하거나 보완 자료를 요청합니다."
  },
  {
    title: "5. 피드백을 확인합니다",
    body: "주석, 요약 피드백, 추가 요청, 완료 기록을 의뢰 상세에서 이어서 봅니다."
  },
  {
    title: "6. 학습 기록으로 남깁니다",
    body: "완료된 슈퍼비전은 슈퍼바이저와 사례 단위로 접어 볼 수 있는 기록으로 보관합니다."
  }
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-surface-base text-ink-900">
      <SiteHeader active="guide" actionHref="/supervisors" actionLabel="시작하기" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10">
        <PageIntro
          eyebrow="진행 방식"
          title="슈퍼비전은 결제 흐름이 아니라 학습 흐름입니다."
          subtitle="처음 이용해도 지금 어디에 있는지 알 수 있도록, 선택부터 학습 기록까지 하나의 흐름으로 이어집니다."
          action={
            <Button asChild>
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
          }
        />

        <FlowStepNav current="슈퍼바이저 선택" steps={flowSteps} />

        <PrimaryActionPanel
          action={
            <Button asChild className="bg-white text-ink-900 hover:bg-slate-100">
              <Link href="/resources">준비 자료 보기</Link>
            </Button>
          }
          title="먼저 맞는 슈퍼바이저를 고르면 됩니다"
        >
          이후 단계는 선택한 슈퍼바이저와 세션 유형에 맞춰 열립니다. 화상 세션은 일정
          선택이 먼저 필요하고, 비동기 검토는 자료 제출부터 시작할 수 있습니다.
        </PrimaryActionPanel>

        <SectionBlock
          title="전체 흐름"
          subtitle="각 단계는 다음 행동 하나만 크게 보여주고, 필요한 정보만 옆에 둡니다."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflowCards.map((item) => (
              <Card className="grid gap-2 rounded-xl shadow-sm" key={item.title}>
                <h2 className="text-lg font-bold text-ink-900">{item.title}</h2>
                <p className="text-sm leading-relaxed text-ink-600">{item.body}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
      </div>
    </main>
  );
}
