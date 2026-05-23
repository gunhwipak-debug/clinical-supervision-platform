import Link from "next/link";
import { AuthPanel, AuthScaffold } from "../auth-ui";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
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
      subtitle="가입한 이메일로 비밀번호 재설정 링크를 보냅니다."
      title="비밀번호 재설정"
    >
      <AuthPanel
        description="계정 확인을 위해 가입 이메일을 입력해주세요."
        notes={[
          "계정 존재 여부는 화면에 표시하지 않습니다.",
          "메일을 받지 못했다면 스팸함을 확인하거나 잠시 뒤 다시 요청해주세요."
        ]}
        title="재설정 메일 보내기"
      >
        <ForgotPasswordForm />
      </AuthPanel>
    </AuthScaffold>
  );
}
