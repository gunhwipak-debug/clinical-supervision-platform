import Link from "next/link";
import { SiteHeader } from "../../components/clinicflow-shell";

export function AuthScaffold({
  action,
  children,
  eyebrow = "계정 접근",
  subtitle,
  title
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <main
      className="min-h-screen bg-white text-[#081225]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <SiteHeader showAction={false} showLogin={false} />
      <div className="mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-6xl gap-10 px-6 pb-14 pt-8 lg:grid-cols-[minmax(0,0.92fr)_420px] lg:items-center lg:px-8 lg:pb-20 lg:pt-10">
        <section className="grid gap-7">
          <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
            {eyebrow}
          </span>
          <div className="grid gap-5">
            <h1 className="max-w-3xl break-keep text-[3rem] font-bold leading-[1] tracking-normal text-[#081225] md:text-[4.35rem]">
              {title}
            </h1>
            <p className="max-w-xl break-keep text-lg leading-8 text-[#5f6c8f]">
              {subtitle}
            </p>
          </div>
          <ul className="grid max-w-xl gap-3 border-t border-[#e7ebf1] pt-5">
            {supportLines.map((line) => (
              <li
                className="flex items-center gap-3 text-base font-semibold text-[#43506f]"
                key={line}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#2563ff]"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4">
          {children}
          {action ? (
            <div className="text-center text-sm font-semibold">{action}</div>
          ) : null}
        </section>
      </div>

      <footer className="border-t border-[#e7ebf1] px-6 py-6 text-sm text-[#5f6c8f] lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-3">
            <Link className="hover:text-[#2563ff]" href="/supervisors">
              슈퍼바이저 찾기
            </Link>
            <Link className="hover:text-[#2563ff]" href="/guide">
              이용 가이드
            </Link>
            <Link className="hover:text-[#2563ff]" href="/privacy">
              개인정보 처리방침
            </Link>
            <Link className="hover:text-[#2563ff]" href="/terms">
              서비스 이용약관
            </Link>
          </nav>
          <p>© {currentYear} ClinicFlow</p>
        </div>
      </footer>
    </main>
  );
}

export function AuthPanel({
  badge,
  children,
  description,
  notes,
  size = "compact",
  title
}: {
  badge?: string;
  children: React.ReactNode;
  description: string;
  notes?: string[];
  size?: "compact" | "wide";
  title: string;
}) {
  const maxWidth = size === "wide" ? "max-w-[520px]" : "max-w-[420px]";

  return (
    <section className={`mx-auto grid w-full ${maxWidth} gap-4`}>
      <div className="rounded-[18px] border border-[#e7ebf1] bg-white p-7 shadow-[0_22px_48px_rgba(8,18,37,0.06)]">
        <div className="grid gap-4">
          {badge ? (
            <span className="w-fit rounded-full border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
              {badge}
            </span>
          ) : null}
          <div className="grid gap-3">
            <h2 className="break-keep text-[2rem] font-bold tracking-normal text-[#081225]">
              {title}
            </h2>
            <p className="break-keep text-base leading-8 text-[#5f6c8f]">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
        {notes && notes.length > 0 ? (
          <ul className="mt-5 grid gap-2 border-t border-[#e7ebf1] pt-4">
            {notes.map((note) => (
              <li className="flex gap-2 text-sm leading-7 text-[#5f6c8f]" key={note}>
                <span
                  aria-hidden="true"
                  className="mt-3 h-1 w-1 rounded-full bg-[#8b94ad]"
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function InlineMessage({
  children,
  tone = "brand"
}: {
  children: React.ReactNode;
  tone?: "brand" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#ffd1d1] bg-[#fff6f6] text-[#c24141]"
      : tone === "neutral"
        ? "border-[#e7ebf1] bg-[#f8faff] text-[#43506f]"
        : "border-[#bfd1ff] bg-[#f5f8ff] text-[#2563ff]";

  return (
    <p className={`rounded-[18px] border px-4 py-3 text-sm leading-7 ${toneClass}`}>
      {children}
    </p>
  );
}

const supportLines = ["의뢰 진행 상태", "피드백 확인", "완료 기록 보관"] as const;
