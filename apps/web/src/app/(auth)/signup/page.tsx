import { AuthScaffold } from "../auth-ui";
import { SignupForm } from "./signup-form";

export default function Page() {
  return (
    <AuthScaffold
      eyebrow="회원가입"
      subtitle="슈퍼비전 의뢰와 피드백 기록을 확인할 계정을 만듭니다."
      title="ClinicFlow 계정 만들기"
    >
      <SignupForm />
    </AuthScaffold>
  );
}
