import { AuthScaffold } from "../auth-ui";
import { SignupForm } from "./signup-form";

export default function Page() {
  return (
    <AuthScaffold
      eyebrow="회원가입"
      subtitle="모든 사용자는 먼저 신청자 계정으로 시작합니다."
      title="처음이라면 계정부터 만듭니다"
    >
      <SignupForm />
    </AuthScaffold>
  );
}
