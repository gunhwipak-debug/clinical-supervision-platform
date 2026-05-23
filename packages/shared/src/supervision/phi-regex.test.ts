import { describe, expect, it } from "vitest";
import { assertNoPhi, detectPhi } from "./phi-regex";

describe("detectPhi", () => {
  it("detects Korean resident registration numbers", () => {
    expect(detectPhi("주민번호 900101-1234567 확인")).toContainEqual({
      kind: "rrn",
      match: "900101-1234567"
    });
  });

  it("does not treat six digit dates as resident numbers", () => {
    expect(detectPhi("검사일은 900101 입니다")).toEqual([]);
  });

  it("detects hyphenated mobile numbers", () => {
    expect(detectPhi("연락처 010-1234-5678")).toContainEqual({
      kind: "phone",
      match: "010-1234-5678"
    });
  });

  it("detects compact mobile numbers", () => {
    expect(detectPhi("연락처 0111234567")).toContainEqual({
      kind: "phone",
      match: "0111234567"
    });
  });

  it("does not treat office-style numbers as mobile numbers", () => {
    expect(detectPhi("대표번호 02-123-4567")).toEqual([]);
  });

  it("detects email addresses", () => {
    expect(detectPhi("메일 test.user@example.com")).toContainEqual({
      kind: "email",
      match: "test.user@example.com"
    });
  });

  it("does not treat plain domains as email addresses", () => {
    expect(detectPhi("example.com 문서")).toEqual([]);
  });

  it("detects compact bank account numbers", () => {
    expect(detectPhi("계좌 123456789012 입금")).toContainEqual({
      kind: "bank_account",
      match: "123456789012"
    });
  });

  it("detects hyphenated bank account numbers", () => {
    expect(detectPhi("계좌 123-456789-01 확인")).toContainEqual({
      kind: "bank_account",
      match: "123-456789-01"
    });
  });

  it("does not treat Korean postal codes as bank accounts", () => {
    expect(detectPhi("우편번호 04524")).toEqual([]);
  });

  it("keeps clean clinical text empty", () => {
    expect(detectPhi("심리평가 보고서 검토 요청")).toEqual([]);
  });

  it("throws with phi_detected for blocked fields", () => {
    expect(() => assertNoPhi("010-1234-5678 관련 의뢰", "title")).toThrow(
      "PHI detected"
    );
  });

  it("does not block Korean names in this regex-only module", () => {
    expect(detectPhi("홍길동 평가")).toEqual([]);
  });
});
