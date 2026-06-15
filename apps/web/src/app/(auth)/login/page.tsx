import { AuthScaffold } from "../auth-ui";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthScaffold
      eyebrow="로그인"
      subtitle="의뢰 현황, 피드백, 학습기록을 확인하려면 로그인하세요."
      title="내 슈퍼비전 현황을 확인합니다"
    >
      <LoginForm returnTo={params.returnTo ?? ""} />
    </AuthScaffold>
  );
}
