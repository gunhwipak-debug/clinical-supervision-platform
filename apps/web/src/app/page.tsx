import Link from "next/link";
import { SiteHeader } from "../components/clinicflow-shell";
import { HomeFeaturePreview } from "../components/home-feature-preview";
import { Button } from "../components/ui/button";

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader />
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-12 pt-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center lg:px-8 lg:pb-16 lg:pt-10">
        <div className="grid gap-7">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            온라인 임상 슈퍼비전
          </span>
          <div className="grid gap-5">
            <h1 className="max-w-3xl break-keep text-[3rem] font-bold leading-[1.02] tracking-normal text-[#081225] md:text-[5rem]">
              슈퍼비전 의뢰와
              <br />
              피드백을 <span className="text-[#2563ff]">한곳에서</span>
            </h1>
            <p className="max-w-xl break-keep text-lg leading-9 text-[#5f6c8f]">
              슈퍼바이저 탐색, 의뢰 작성, 결제, 피드백, 기록 보관을 한 화면 흐름으로
              정리합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="h-12 rounded-[14px] bg-[#2563ff] px-6 text-base font-semibold text-white hover:bg-[#1f58e6]"
              size="lg"
            >
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
            <Button
              asChild
              className="h-12 rounded-[14px] border border-[#e7ebf1] bg-white px-6 text-base font-semibold text-[#081225] hover:bg-[#f8faff]"
              size="lg"
              variant="secondary"
            >
              <Link href="/guide">이용 흐름 보기</Link>
            </Button>
          </div>
        </div>

        <div className="lg:justify-self-stretch">
          <HomeFeaturePreview variant="hero" />
        </div>
      </section>

      <section className="bg-[#081225] py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-4 lg:px-8">
          {flow.map((item) => (
            <article className="border-l border-white/14 pl-5" key={item.title}>
              <span className="inline-flex rounded-full bg-[#173276] px-3 py-1 text-xs font-semibold text-[#b9cbff]">
                {item.kicker}
              </span>
              <h2 className="mt-6 text-[2rem] font-bold tracking-normal text-white">
                {item.title}
              </h2>
              <p className="mt-4 break-keep text-base leading-8 text-[#c0cae0]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e7ebf1] bg-[#fbfcff]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div className="grid gap-6">
            <h2 className="break-keep text-[2.6rem] font-bold leading-tight tracking-normal text-[#081225] md:text-[4rem]">
              처음 신청해도
              <br />
              다음 단계가 보이게
            </h2>
            <p className="max-w-3xl break-keep text-lg leading-9 text-[#5f6c8f]">
              ClinicFlow는 결제 화면부터 보여주는 서비스가 아닙니다. 먼저 맞는
              슈퍼바이저를 고르고, 필요한 자료를 정리하고, 받은 피드백을 학습 기록으로
              남기는 교육 흐름을 기준으로 설계합니다.
            </p>
          </div>
          <div className="grid content-start gap-3">
            <Button
              asChild
              className="h-12 rounded-[14px] bg-[#2563ff] px-6 text-base font-semibold text-white hover:bg-[#1f58e6]"
              size="lg"
            >
              <Link href="/requests/new">슈퍼비전 신청하기</Link>
            </Button>
            <Button
              asChild
              className="h-12 rounded-[14px] border border-[#e7ebf1] bg-white px-6 text-base font-semibold text-[#081225] hover:bg-[#f8faff]"
              size="lg"
              variant="secondary"
            >
              <Link href="/supervisors">슈퍼바이저 먼저 보기</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

const flow = [
  {
    kicker: "슈퍼바이저 선택",
    title: "슈퍼바이저를 선택합니다",
    body: "사진, 자격, 전문분야, 소개를 보고 내 사례에 맞는 슈퍼바이저를 비교합니다."
  },
  {
    kicker: "사례자료 정리",
    title: "필요한 자료만 정리합니다",
    body: "상담 흐름, 질문, 참고 자료를 한 화면에서 확인하고 제출합니다."
  },
  {
    kicker: "피드백 확인",
    title: "피드백을 확인합니다",
    body: "보완 요청과 최종 피드백을 구분해 확인합니다."
  },
  {
    kicker: "학습 기록",
    title: "배운 내용을 남깁니다",
    body: "완료된 슈퍼비전 기록과 피드백을 이후 학습 기록으로 다시 확인합니다."
  }
] as const;
