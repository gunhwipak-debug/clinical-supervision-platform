import { InfoPage } from "../_components/info-page";

export default function SecurityPage() {
  return (
    <InfoPage eyebrow="보안" title="보안 기준">
      <p>
        ClinicFlow는 민감한 임상자료를 일반 첨부파일처럼 다루지 않도록, 접근 권한, 감사
        로그, 다운로드 워터마크, 보관기간을 핵심 보안 기준으로 둡니다.
      </p>
      <ul className="grid gap-sm">
        <li>계정과 역할에 따라 의뢰 자료 접근 범위를 분리합니다.</li>
        <li>관리자 접근은 사유 기록을 전제로 합니다.</li>
        <li>미리보기와 서명 URL에는 접근자, 시각, 목적을 추적할 수 있는 기록을 남깁니다.</li>
        <li>구글 캘린더에는 PHI를 저장하지 않고 예약 시간 정보만 연동합니다.</li>
      </ul>
      <p>
        운영 환경에서는 저장소 권한, 암호화 키 관리, 악성 파일 검사, 백업·복구 절차를
        배포 전 점검해야 합니다. 이 항목은 실제 인프라 구성에 따라 법률·보안 검토가
        필요합니다.
      </p>
    </InfoPage>
  );
}
