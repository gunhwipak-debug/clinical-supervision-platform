import Link from "next/link";
import { AuthPanel, AuthScaffold } from "../../auth-ui";
import { VerifyForm } from "./verify-form";

export default function EmailVerifyPage() {
  return (
    <AuthScaffold
      action={
        <Link
          className="text-sm font-semibold text-[#2563ff] hover:underline"
          href="/login"
        >
          로그인으로 돌아가기
        </Link>
      }
      eyebrow="이메일 인증"
      subtitle="메일로 받은 확인 정보를 입력하면 계정을 사용할 수 있습니다."
      title="이메일 확인"
    >
      <AuthPanel
        description="가입한 이메일로 받은 확인 정보를 입력해주세요."
        title="계정 확인"
      >
        <VerifyForm />
      </AuthPanel>
    </AuthScaffold>
  );
}
