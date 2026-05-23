import { InfoPage } from "../_components/info-page";

export default function SensitiveConsentPage() {
  return (
    <InfoPage eyebrow="정책" title="민감정보 처리 동의">
      <p>
        ClinicFlow는 슈퍼비전 의뢰를 처리하기 위해 사용자가 제출한 임상자료, 의뢰 맥락,
        첨부파일, 검토 의견에 포함될 수 있는 민감정보를 다룹니다.
      </p>
      <p>
        자료는 의뢰 당사자, 배정된 슈퍼바이저, 사유가 기록된 관리자에게만 필요한
        범위에서 제공되며, 접근과 다운로드 이력은 감사 기록으로 남깁니다.
      </p>
      <p>
        사용자는 내담자 식별정보를 제거하고 필요한 동의를 확인한 뒤 자료를 제출해야
        하며, 서비스는 예약, 검토, 피드백, 완료 기록 발급 목적 안에서만 자료를
        처리합니다.
      </p>
    </InfoPage>
  );
}
