import { AuthScaffold } from "../auth-ui";
import { SignupForm } from "./signup-form";

export default function Page() {
  return (
    <AuthScaffold
      title="ClinicFlow 가입"
      subtitle="모든 사용자는 먼저 슈퍼바이지 계정으로 시작합니다."
    >
      <SignupForm />
    </AuthScaffold>
  );
}
