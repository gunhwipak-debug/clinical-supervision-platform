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
  const introProps = {
    ...(action ? { action } : {}),
    ...(subtitle ? { subtitle } : {}),
    title
  };

  return (
    <main className="min-h-screen bg-surface-base">
      <SiteHeader
        {...(active ? { active } : {})}
        showAction={false}
        showLogin={false}
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8">
        <PageIntro {...introProps} />
        {children}
      </div>
    </main>
  );
}
