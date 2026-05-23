import { AppShell } from "../components/app-shell";
import { LoadingState } from "../components/ui/state";

export default function Loading() {
  return (
    <AppShell
      title="화면을 준비하고 있습니다"
      subtitle="필요한 정보를 불러오는 중입니다."
    >
      <LoadingState label="페이지 로딩 중" />
    </AppShell>
  );
}
