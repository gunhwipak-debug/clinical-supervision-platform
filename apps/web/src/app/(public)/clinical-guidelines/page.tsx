import { InfoPage } from "../_components/info-page";

export default function ClinicalGuidelinesPage() {
  return (
    <InfoPage eyebrow="임상 운영" title="임상 가이드라인">
      <p>
        ClinicFlow의 슈퍼비전 기록은 수련과 사례 이해를 돕기 위한 문서이며, 독립적인
        진단서나 감정서로 쓰이도록 설계되지 않았습니다.
      </p>
      <p>
        슈퍼바이지는 원자료와 보고서에서 이름, 연락처, 등록번호, 기관명 등 식별 가능성이
        높은 정보를 제거한 뒤 제출해야 합니다.
      </p>
      <p>
        슈퍼바이저는 검토 범위, 자료의 한계, 추가 확인이 필요한 부분을 명확히 남겨야
        하며, 완료 기록은 실제 검토한 자료와 피드백 범위에 한정됩니다.
      </p>
    </InfoPage>
  );
}
