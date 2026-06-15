import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { SiteHeader } from "../../../components/clinicflow-shell";

export default function GuidePage() {
  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader active="guide" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-10 lg:px-8">
        <section className="grid gap-5">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            이용 가이드
          </span>
          <div className="grid gap-4">
            <h1 className="max-w-5xl break-keep text-[3rem] font-bold leading-[0.98] tracking-normal text-[#081225] md:text-[4.6rem]">
              슈퍼비전 신청부터 기록까지 한 흐름으로
            </h1>
            <p className="max-w-3xl break-keep text-lg leading-9 text-[#5f6c8f]">
              슈퍼바이저를 고르고, 자료를 업로드하고, 피드백을 받아 학습 기록으로
              남깁니다.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#e7ebf1] bg-white shadow-[0_18px_44px_rgba(8,18,37,0.05)]">
          <div className="grid md:grid-cols-2 xl:grid-cols-8">
            {steps.map((step, index) => (
              <article
                className="relative grid gap-4 border-b border-[#e7ebf1] px-5 py-6 last:border-b-0 md:border-r md:last:border-r-0 xl:min-h-[230px] xl:border-b-0"
                key={step.title}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eef3ff] text-sm font-semibold text-[#2563ff]">
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="grid size-6 place-items-center rounded-full bg-[#2563ff] text-sm font-semibold text-white">
                      →
                    </span>
                  ) : null}
                </div>
                <h2 className="break-keep text-[1.15rem] font-bold leading-8 text-[#081225]">
                  {step.title}
                </h2>
                <p className="break-keep text-base leading-8 text-[#5f6c8f]">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_1fr_1fr_1fr]">
          <article className="rounded-[20px] bg-[#081225] px-6 py-7 text-white">
            <h2 className="text-[2rem] font-bold tracking-normal">신청 전 확인할 것</h2>
            <p className="mt-4 break-keep text-base leading-8 text-[#c0cae0]">
              자료 준비와 작성 기준은 별도 페이지로 흩어두지 않고, 신청 과정 안에서 바로
              확인합니다.
            </p>
          </article>

          {resources.map((item) => (
            <article
              className="grid gap-4 rounded-[20px] border border-[#e7ebf1] bg-white px-6 py-7"
              key={item.title}
            >
              <h2 className="text-[1.75rem] font-bold tracking-normal text-[#081225]">
                {item.title}
              </h2>
              <p className="break-keep text-base leading-8 text-[#5f6c8f]">
                {item.body}
              </p>
              <Button
                asChild
                className="mt-auto h-11 rounded-[14px] border border-[#e7ebf1] bg-white px-4 text-sm font-semibold text-[#081225] hover:bg-[#f8faff]"
                variant="secondary"
              >
                <Link href={item.href as never}>바로 보기</Link>
              </Button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

const steps = [
  {
    title: "슈퍼바이저 찾기",
    body: "사진, 자격, 전문분야, 소개를 보고 사례에 맞는 사람을 고릅니다."
  },
  {
    title: "세션 선택",
    body: "사례 개념화, 평가 자문, 보고서 피드백 중 필요한 방식을 정합니다."
  },
  {
    title: "일정 선택",
    body: "가능한 시간을 확인하고 무리가 없는 일정으로 예약합니다."
  },
  {
    title: "사례 자료 업로드",
    body: "주호소, 의뢰 사유, 참고 자료를 필요한 항목만 정리합니다."
  },
  {
    title: "확인·결제",
    body: "선택한 슈퍼바이저, 세션, 일정, 자료를 확인하고 신청을 확정합니다."
  },
  {
    title: "수락 대기",
    body: "슈퍼바이저가 일정과 자료를 확인할 때까지 현재 상태를 봅니다."
  },
  {
    title: "슈퍼비전 검토",
    body: "필요한 경우 보완 자료를 보내고 슈퍼바이저의 검토를 이어갑니다."
  },
  {
    title: "피드백 확인",
    body: "최종 피드백과 보완 의견을 구분해 확인합니다."
  }
] as const;

const resources = [
  {
    title: "자료 작성 기준",
    body: "주호소, 의뢰 사유, 검사자료를 어떤 순서로 준비하면 되는지 정리합니다.",
    href: "/clinical-guidelines"
  },
  {
    title: "자료 정리 기준",
    body: "사례를 이해하는 데 필요한 내용과 제외되는 정보를 구분하는 기준입니다.",
    href: "/sensitive-consent"
  },
  {
    title: "학습기록 활용",
    body: "완료된 피드백을 다시 읽고 기관 교육 이력으로 관리하는 방법입니다.",
    href: "/resources"
  }
] as const;
