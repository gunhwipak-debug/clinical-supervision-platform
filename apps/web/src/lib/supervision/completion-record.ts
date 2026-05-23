export const COMPLETION_RECORD_RESPONSIBILITY_NOTICE =
  "이 완료 기록은 ClinicFlow를 통한 슈퍼비전 수행 사실과 검토 범위를 확인하는 기록이며, 진단서, 감정서, 법적 증명서 또는 치료 결과 보증서가 아닙니다. 최종 임상 판단, 외부 제출 문서의 내용, 환자 또는 의뢰기관에 대한 설명 책임은 담당 임상가에게 있습니다.";

export function appendMandatoryResponsibilityNotice(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes(COMPLETION_RECORD_RESPONSIBILITY_NOTICE)) {
    return trimmed;
  }
  return `${trimmed}\n\n${COMPLETION_RECORD_RESPONSIBILITY_NOTICE}`.trim();
}
