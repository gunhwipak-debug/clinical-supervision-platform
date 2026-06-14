import { InfoPage } from "../_components/info-page";

export default function ResourcesPage() {
  return (
    <InfoPage eyebrow="가이드·자료" title="슈퍼비전 준비 자료">
      <p>
        이 페이지는 별도의 자료 창고가 아니라, 의뢰를 시작하기 전에 필요한 준비물을
        짧게 확인하는 곳입니다.
      </p>
      <ul className="grid gap-3">
        <li className="rounded-lg border border-line bg-surface-sunken p-4">
          <strong className="block text-ink-900">사례 요약</strong>
          주호소, 의뢰 사유, 이미 시행한 평가나 상담 내용을 한 문단으로 정리합니다.
        </li>
        <li className="rounded-lg border border-line bg-surface-sunken p-4">
          <strong className="block text-ink-900">검토받을 자료</strong>
          보고서 초안, 검사 결과, 축어록, 상담 기록처럼 슈퍼바이저가 실제로 볼 자료를
          준비합니다.
        </li>
        <li className="rounded-lg border border-line bg-surface-sunken p-4">
          <strong className="block text-ink-900">확인받고 싶은 질문</strong>
          “진단 가설을 어떻게 정리할지”, “보고서 문장을 어떻게 수정할지”처럼 구체적인
          질문을 적어두면 피드백이 명확해집니다.
        </li>
      </ul>
    </InfoPage>
  );
}
