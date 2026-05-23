import { AdminCard, AdminShell } from "../components/admin-shell";

export default function Loading() {
  return (
    <AdminShell title="운영 콘솔 로딩" subtitle="큐와 지표를 불러오는 중입니다.">
      <AdminCard className="grid gap-4" aria-live="polite">
        <div className="h-4 w-40 rounded-md bg-surface-sunken" />
        <div className="h-4 w-3/4 rounded-md bg-surface-sunken" />
        <div className="h-24 rounded-md bg-surface-sunken" />
      </AdminCard>
    </AdminShell>
  );
}
