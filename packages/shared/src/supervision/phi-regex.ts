export type PhiKind = "rrn" | "phone" | "email" | "bank_account";

export type PhiDetection = {
  kind: PhiKind;
  match: string;
};

const rrnRegex = /\b\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-[1-4]\d{6}\b/gu;
const phoneRegex = /\b01[016789]-?\d{3,4}-?\d{4}\b/gu;
const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const accountCandidateRegex = /(?<!\d)(?:\d[\s-]?){10,20}(?!\d)/gu;

export class PhiDetectedError extends Error {
  readonly code = "phi_detected";

  constructor(
    readonly fieldName: string,
    readonly detections: PhiDetection[]
  ) {
    super(`PHI detected in ${fieldName}`);
  }
}

export function detectPhi(text: string): PhiDetection[] {
  const detections: PhiDetection[] = [];

  collectMatches(detections, "rrn", text, rrnRegex);
  collectMatches(detections, "phone", text, phoneRegex);
  collectMatches(detections, "email", text, emailRegex);

  for (const match of text.matchAll(accountCandidateRegex)) {
    const value = match[0];
    const digits = value.replace(/\D/gu, "");
    if (digits.length < 10 || isPhoneLike(value) || isRrnLike(value)) {
      continue;
    }
    detections.push({ kind: "bank_account", match: value.trim() });
  }

  return dedupe(detections);
}

export function assertNoPhi(text: string, fieldName: string): void {
  const detections = detectPhi(text);
  if (detections.length > 0) {
    throw new PhiDetectedError(fieldName, detections);
  }
}

function collectMatches(
  detections: PhiDetection[],
  kind: PhiKind,
  text: string,
  regex: RegExp
): void {
  regex.lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    detections.push({ kind, match: match[0] });
  }
}

function isPhoneLike(value: string): boolean {
  return new RegExp(`^${phoneRegex.source}$`, "u").test(value.trim());
}

function isRrnLike(value: string): boolean {
  return new RegExp(`^${rrnRegex.source}$`, "u").test(value.trim());
}

function dedupe(detections: PhiDetection[]): PhiDetection[] {
  const seen = new Set<string>();
  return detections.filter((detection) => {
    const key = `${detection.kind}:${detection.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
