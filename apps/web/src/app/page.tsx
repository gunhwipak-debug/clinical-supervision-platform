import Link from "next/link";
import { SiteHeader } from "../components/clinicflow-shell";
import { Button } from "../components/ui/button";

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader />
      <section className="mx-auto grid w-full max-w-7xl gap-14 px-6 pb-14 pt-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:px-8 lg:pb-20 lg:pt-10">
        <div className="grid gap-8">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            온라인 슈퍼비전
          </span>
          <div className="grid gap-6">
            <h1 className="max-w-4xl break-keep text-[3.8rem] font-bold leading-[0.96] tracking-normal text-[#081225] md:text-[6.25rem]">
              슈퍼비전 의뢰와
              <br />
              피드백을 <span className="text-[#2563ff]">한곳에서</span>
              <br />
              관리합니다
            </h1>
            <p className="max-w-2xl break-keep text-lg leading-9 text-[#5f6c8f]">
              병원과 센터 실무자가 슈퍼바이저를 찾고, 사례 자료를 정리해 제출한 뒤, 받은
              피드백을 학습 기록으로 남기는 온라인 교육 플랫폼입니다.
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
              <Link href="/guide">진행 과정 보기</Link>
            </Button>
          </div>
        </div>

        <div className="relative lg:justify-self-end">
          <div className="rounded-[18px] border border-[#e7ebf1] bg-white p-7 shadow-[0_28px_60px_rgba(8,18,37,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-[#8b94ad]">현재 의뢰</p>
                <h2 className="text-[2.15rem] font-bold leading-none text-[#081225]">
                  REQ-1042
                </h2>
              </div>
              <span className="rounded-full border border-[#ffd8a8] bg-[#fff8ee] px-4 py-2 text-sm font-semibold text-[#d97706]">
                사례자료 정리 중
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {previewRows.map((row) => (
                <div
                  className="rounded-[18px] border border-[#e7ebf1] bg-[#fbfcff] px-4 py-4"
                  key={row.title}
                >
                  <strong className="text-[1.15rem] font-semibold text-[#081225]">
                    {row.title}
                  </strong>
                  <p className="mt-2 text-sm leading-7 text-[#5f6c8f]">{row.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-2 right-[-1.5rem] rounded-[24px] border border-[#e7ebf1] bg-white px-6 py-7 shadow-[0_20px_40px_rgba(8,18,37,0.09)]">
            <p className="text-[3.4rem] font-bold leading-none tracking-normal text-[#081225]">
              다음
            </p>
            <p className="mt-2 text-[1.85rem] font-semibold leading-none text-[#081225]">
              최종 확인
            </p>
          </div>
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

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
        <div className="grid content-start gap-5">
          <span className="w-fit rounded-md border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            병원·센터 실무자를 위한 흐름
          </span>
          <h2 className="break-keep text-[3rem] font-bold leading-tight tracking-normal text-[#081225] md:text-[4.5rem]">
            자료를 찾고,
            <br />
            묻고, 남기는 일을
            <br />한 줄로 정리합니다
          </h2>
        </div>
        <div className="grid gap-0 rounded-[18px] border border-[#e7ebf1] bg-white">
          {serviceRows.map((row) => (
            <div
              className="grid gap-3 border-b border-[#e7ebf1] px-6 py-6 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]"
              key={row.title}
            >
              <strong className="text-lg font-bold text-[#081225]">{row.title}</strong>
              <p className="break-keep text-base leading-8 text-[#5f6c8f]">
                {row.body}
              </p>
            </div>
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

const previewRows = [
  {
    title: "이민서 슈퍼바이저",
    body: "성인 평가 · 사례 개념화 50분 · 6월 18일 19:00"
  },
  {
    title: "사례 자료",
    body: "보고서 초안, 검사 결과, 면담 요약 제출을 준비 중입니다."
  },
  {
    title: "다음 행동",
    body: "자료를 확인하고 최종 제출 전 선택 내용을 다시 봅니다."
  }
] as const;

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

const serviceRows = [
  {
    title: "신청 전",
    body: "사진, 자격, 전문분야, 소개를 보고 사례에 맞는 슈퍼바이저를 비교합니다."
  },
  {
    title: "사례자료 정리",
    body: "보고서 초안, 검사 결과, 면담 요약, 묻고 싶은 질문을 한 화면에서 정리합니다."
  },
  {
    title: "검토 중",
    body: "추가 자료 요청과 진행 상태를 구분해 보고, 지금 해야 할 행동만 선택합니다."
  },
  {
    title: "완료 후",
    body: "최종 피드백과 보완 내용을 슈퍼바이저별 학습 기록으로 다시 찾을 수 있게 남깁니다."
  }
] as const;
