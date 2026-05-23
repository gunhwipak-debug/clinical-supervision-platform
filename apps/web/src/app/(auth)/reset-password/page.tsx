import Link from "next/link";
import { AuthPanel, AuthScaffold } from "../auth-ui";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthScaffold
      action={
        <Link
          className="text-sm font-semibold text-brand-700 hover:underline"
          href="/login"
        >
          로그인으로 돌아가기
        </Link>
      }
      subtitle="메일로 받은 토큰과 새 비밀번호를 입력합니다."
      title="새 비밀번호 설정"
    >
      <AuthPanel
        description="비밀번호는 10자 이상이며 숫자와 특수문자를 포함해야 합니다."
        title="비밀번호 변경"
      >
        <ResetPasswordForm initialToken={params.token ?? ""} />
      </AuthPanel>
    </AuthScaffold>
  );
}
