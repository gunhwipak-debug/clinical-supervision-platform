import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { SiteHeader } from "../../../components/clinicflow-shell";

export default function ResourcesPage() {
  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader active="guide" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-10 lg:px-8">
        <section className="grid gap-5">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            가이드 · 자료
          </span>
          <div className="grid gap-4">
            <h1 className="max-w-4xl break-keep text-[3rem] font-bold leading-[0.98] tracking-normal text-[#081225] md:text-[4.4rem]">
              의뢰 전에 필요한 기준만 확인합니다
            </h1>
            <p className="max-w-3xl break-keep text-lg leading-9 text-[#5f6c8f]">
              진행 방식, 자료 작성 기준, 제출 전 점검만 짧게 확인하고 슈퍼바이저
              선택으로 이어집니다.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-[18px] border border-[#e7ebf1] bg-white">
            {resources.map((item) => (
              <Link
                className="grid gap-2 border-b border-[#e7ebf1] px-6 py-5 transition hover:bg-[#f8faff] last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                href={item.href as never}
                key={item.title}
              >
                <span>
                  <strong className="text-[1.35rem] font-bold text-[#081225]">
                    {item.title}
                  </strong>
                  <span className="mt-2 block break-keep text-base leading-8 text-[#5f6c8f]">
                    {item.body}
                  </span>
                </span>
                <span className="text-sm font-semibold text-[#2563ff]">보기</span>
              </Link>
            ))}
          </div>

          <aside className="grid gap-4 rounded-[18px] border border-[#e7ebf1] bg-white px-6 py-6">
            <div>
              <h2 className="text-[1.6rem] font-bold tracking-normal text-[#081225]">
                자료를 준비할 때
              </h2>
              <p className="mt-3 break-keep text-base leading-8 text-[#5f6c8f]">
                먼저 진행 흐름을 보고, 필요한 자료만 정리한 뒤 슈퍼바이저를 선택합니다.
              </p>
            </div>
            <div className="grid gap-3">
              <Button
                asChild
                className="h-12 rounded-[16px] bg-[#2563ff] text-base font-semibold text-white hover:bg-[#1f58e6]"
              >
                <Link href="/guide">이용 가이드 보기</Link>
              </Button>
              <Button
                asChild
                className="h-12 rounded-[16px] border border-[#e7ebf1] bg-white text-base font-semibold text-[#081225] hover:bg-[#f8faff]"
                variant="secondary"
              >
                <Link href="/supervisors">슈퍼바이저 찾기</Link>
              </Button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

const resources = [
  {
    title: "이용 가이드",
    body: "슈퍼바이저 선택부터 학습 기록까지 전체 흐름을 봅니다.",
    href: "/guide"
  },
  {
    title: "자료 작성 기준",
    body: "주호소, 의뢰 사유, 검사 결과, 질문을 어떤 순서로 정리할지 봅니다.",
    href: "/clinical-guidelines"
  },
  {
    title: "제출 전 점검",
    body: "사례 자료를 올리기 전에 꼭 확인할 항목을 봅니다.",
    href: "/sensitive-consent"
  },
  {
    title: "개인정보 처리방침",
    body: "자료와 기록이 어떻게 보관되는지 확인합니다.",
    href: "/privacy"
  }
] as const;
