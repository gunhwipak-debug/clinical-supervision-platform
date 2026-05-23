import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";

export function AuthScaffold({
  action,
  children,
  subtitle,
  title
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-surface-base text-ink-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col px-6 py-9">
        <Link className="mb-10 grid justify-items-center text-center" href="/">
          <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-ink-900 text-surface-elevated">
            <ShieldCheck aria-hidden size={24} />
          </div>
          <h1 className="text-4xl font-bold leading-tight text-ink-900">{title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-700">{subtitle}</p>
        </Link>

        <div className="grid flex-1 place-items-start">
          <div className="w-full">
            {children}
            {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-sm font-medium text-ink-500">
          <ShieldCheck aria-hidden className="text-brand-500" size={22} />
          <span>민감정보 보호 연결</span>
        </div>

        <footer className="mt-10 border-t border-line pt-8 text-ink-500">
          <p className="mb-6 text-3xl font-bold text-ink-900">ClinicFlow</p>
          <nav className="grid gap-4 text-lg">
            <Link href="/privacy">개인정보 처리방침</Link>
            <Link href="/terms">서비스 이용약관</Link>
            <Link href="/security">보안 기준</Link>
            <Link href="/forgot-password">계정 지원</Link>
          </nav>
          <p className="mt-10 text-lg leading-relaxed">
            © {currentYear} ClinicFlow. 민감정보 보호 아키텍처를 기준으로 운영됩니다.
          </p>
        </footer>
      </div>
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
  const maxWidth = size === "wide" ? "max-w-2xl" : "max-w-[440px]";

  return (
    <section className={`mx-auto grid w-full ${maxWidth} gap-5`}>
      <Card className="rounded-2xl border-line bg-surface-elevated p-10 shadow-card md:p-10">
        <div className="mb-6 grid gap-3 text-center">
          {badge ? (
            <Badge className="mx-auto w-fit" tone="accent">
              {badge}
            </Badge>
          ) : null}
          <div>
            <h2 className="text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink-700 sm:text-xl">
              {description}
            </p>
          </div>
        </div>
        {children}
      </Card>

      {notes && notes.length > 0 ? (
        <ul className="grid gap-3 text-sm text-ink-700">
          {notes.map((note) => (
            <li
              className="rounded-2xl border border-line bg-surface-elevated px-4 py-3"
              key={note}
            >
              {note}
            </li>
          ))}
        </ul>
      ) : null}
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
      ? "bg-danger/10 text-danger"
      : tone === "neutral"
        ? "bg-surface-sunken text-ink-700"
        : "bg-brand-50 text-brand-700";

  return (
    <p className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${toneClass}`}>
      {children}
    </p>
  );
}
