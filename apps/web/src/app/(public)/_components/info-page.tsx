import Link from "next/link";
import { PageIntro, SiteHeader } from "../../../components/clinicflow-shell";

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
    <main className="min-h-screen bg-surface-base text-ink-900">
      <SiteHeader active="resources" />
      <div className="mx-auto grid w-full max-w-4xl gap-8 px-5 py-10">
        <PageIntro eyebrow={eyebrow} title={title} />
        <section className="grid gap-5 rounded-xl border border-line bg-surface-elevated p-6 text-base leading-relaxed text-ink-700 shadow-card">
          {children}
        </section>
        <nav className="flex flex-wrap gap-2 border-t border-line pt-5 text-sm font-semibold text-ink-600">
          <Link className="rounded-md px-3 py-2 hover:bg-surface-sunken" href="/guide">
            진행 방식
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-surface-sunken" href="/resources">
            가이드·자료
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-surface-sunken" href="/privacy">
            개인정보 처리방침
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-surface-sunken" href="/terms">
            서비스 이용약관
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-surface-sunken" href="/security">
            자료 관리 기준
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-surface-sunken" href="/clinical-guidelines">
            임상 가이드라인
          </Link>
        </nav>
      </div>
    </main>
  );
}
