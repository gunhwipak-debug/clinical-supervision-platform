import Link from "next/link";
import { Children } from "react";
import { SiteHeader } from "../../../components/clinicflow-shell";

export function InfoPage({
  children,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader active="guide" showAction={false} />
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 pb-16 pt-10 lg:px-8">
        <section className="grid gap-4">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            {eyebrow}
          </span>
          <h1 className="max-w-4xl break-keep text-[2.8rem] font-bold leading-[1] tracking-normal text-[#081225] md:text-[4.2rem]">
            {title}
          </h1>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-[#e7ebf1] bg-white">
          <div className="grid gap-0 text-base leading-9 text-[#43506f]">
            {Children.map(children, (child, index) => (
              <div
                className="border-b border-[#e7ebf1] px-6 py-5 last:border-b-0"
                key={index}
              >
                {child}
              </div>
            ))}
          </div>
        </section>

        <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[#5f6c8f]">
          <Link
            className="rounded-full border border-[#e7ebf1] px-4 py-2 hover:bg-[#f8faff]"
            href="/guide"
          >
            이용 가이드
          </Link>
          <Link
            className="rounded-full border border-[#e7ebf1] px-4 py-2 hover:bg-[#f8faff]"
            href="/privacy"
          >
            개인정보 처리방침
          </Link>
          <Link
            className="rounded-full border border-[#e7ebf1] px-4 py-2 hover:bg-[#f8faff]"
            href="/terms"
          >
            서비스 이용약관
          </Link>
          <Link
            className="rounded-full border border-[#e7ebf1] px-4 py-2 hover:bg-[#f8faff]"
            href="/security"
          >
            자료 관리 기준
          </Link>
        </nav>
      </div>
    </main>
  );
}
