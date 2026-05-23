import Link from "next/link";

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
    <main className="min-h-screen bg-background px-margin-mobile py-xl text-on-surface md:px-gutter">
      <section className="mx-auto grid w-full max-w-3xl gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
        <Link
          className="font-headline-md text-headline-md font-bold text-primary"
          href="/"
        >
          ClinicFlow
        </Link>
        <div>
          <p className="font-label-md text-label-md text-secondary">{eyebrow}</p>
          <h1 className="mt-sm font-headline-lg text-headline-lg text-primary">
            {title}
          </h1>
        </div>
        <div className="grid gap-md font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {children}
        </div>
        <nav className="flex flex-wrap gap-sm border-t border-outline-variant pt-md font-label-md text-label-md">
          <Link className="text-secondary hover:underline" href="/resources">
            자료실
          </Link>
          <Link className="text-secondary hover:underline" href="/privacy">
            개인정보 처리방침
          </Link>
          <Link className="text-secondary hover:underline" href="/terms">
            서비스 이용약관
          </Link>
          <Link className="text-secondary hover:underline" href="/sensitive-consent">
            민감정보 처리 동의
          </Link>
          <Link className="text-secondary hover:underline" href="/security">
            보안 기준
          </Link>
          <Link className="text-secondary hover:underline" href="/clinical-guidelines">
            임상 가이드라인
          </Link>
        </nav>
      </section>
    </main>
  );
}
