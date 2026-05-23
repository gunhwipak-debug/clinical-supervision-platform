import { AuthScaffold } from "../auth-ui";
import { LoginForm } from "./login-form";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthScaffold
      title="ClinicFlow 로그인"
      subtitle="계정 역할에 맞는 작업 공간으로 안전하게 이동합니다."
    >
      <LoginForm returnTo={params.returnTo ?? ""} />
    </AuthScaffold>
  );
}
