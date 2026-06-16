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
      subtitle="의뢰, 결제, 피드백, 기록을 안전하게 확인합니다."
      title="내 슈퍼비전 현황을 확인합니다"
    >
      <LoginForm returnTo={params.returnTo ?? ""} />
    </AuthScaffold>
  );
}
