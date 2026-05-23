import { InfoPage } from "../_components/info-page";

export default function ResourcesPage() {
  return (
    <InfoPage eyebrow="자료실" title="ClinicFlow 사용 자료">
      <p>
        ClinicFlow는 슈퍼바이지가 비식별화된 임상자료를 안전하게 전달하고, 슈퍼바이저가
        웹에서 자료를 검토하며 주석과 피드백을 남기는 업무 흐름을 지원합니다.
      </p>
      <ul className="grid gap-sm">
        <li>1. 슈퍼바이저 프로필에서 상품과 가능 일정을 먼저 확인합니다.</li>
        <li>2. 의뢰서 작성 후 필요한 자료를 비식별화해 업로드합니다.</li>
        <li>3. 슈퍼바이저는 미리보기 화면에서 자료별 주석과 피드백을 작성합니다.</li>
        <li>4. 완료 기록은 검토 범위와 책임 경계를 함께 남깁니다.</li>
      </ul>
    </InfoPage>
  );
}
