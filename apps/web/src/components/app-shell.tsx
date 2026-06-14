import { PageIntro, SiteHeader } from "./clinicflow-shell";

export function AppShell({
  active,
  title,
  subtitle,
  action,
  children
}: {
  active?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-base">
      <SiteHeader {...(active ? { active } : {})} />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8">
        <PageIntro action={action} subtitle={subtitle} title={title} />
        {children}
      </div>
    </main>
  );
}
