import Link from "next/link";
import type { AppShellUser, NavKey } from "../../../../components/app-navigation";
import { AppShell } from "../../../../components/app-shell";
import { PrimaryActionPanel } from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";

export function SupervisorPageLoadError({
  active,
  currentUser,
  subtitle,
  title
}: {
  active: NavKey;
  currentUser: AppShellUser;
  subtitle: string;
  title: string;
}) {
  return (
    <AppShell
      active={active}
      currentUser={currentUser}
      title={title}
      subtitle={subtitle}
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">업무 홈</Link>
        </Button>
      }
    >
      <PrimaryActionPanel
        eyebrow="불러오기 실패"
        title="현재 정보를 불러오지 못했습니다"
        action={
          <Button asChild variant="secondary">
            <Link href="/supervisor">업무 홈으로 이동</Link>
          </Button>
        }
      >
        페이지를 새로고침해도 반복되면 잠시 후 다시 시도해주세요. 이미 저장된 정보는
        그대로 보관됩니다.
      </PrimaryActionPanel>
    </AppShell>
  );
}
