import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  nextStates,
  type SupervisionStatus
} from "./status-machine";

const flowA: Array<{
  from: SupervisionStatus;
  to: SupervisionStatus;
  actor: "supervisee" | "supervisor" | "admin" | "system";
}> = [
  { from: "submitted", to: "awaiting_payment", actor: "supervisee" },
  { from: "awaiting_payment", to: "paid", actor: "system" },
  { from: "paid", to: "awaiting_supervisor_review", actor: "system" },
  { from: "awaiting_supervisor_review", to: "accepted", actor: "supervisor" },
  { from: "accepted", to: "in_review", actor: "supervisor" },
  { from: "in_review", to: "additional_info_requested", actor: "supervisor" },
  { from: "additional_info_requested", to: "in_review", actor: "supervisee" },
  { from: "in_review", to: "feedback_submitted", actor: "supervisor" },
  { from: "feedback_submitted", to: "additional_info_requested", actor: "supervisor" },
  { from: "feedback_submitted", to: "completion_record_issued", actor: "supervisor" },
  { from: "feedback_submitted", to: "completed", actor: "supervisee" },
  { from: "completion_record_issued", to: "completed", actor: "supervisee" }
];

const blocked: Array<{
  from: SupervisionStatus;
  to: SupervisionStatus;
  actor: "supervisee" | "supervisor" | "admin" | "system";
}> = [
  { from: "draft", to: "paid", actor: "supervisee" },
  { from: "submitted", to: "paid", actor: "supervisee" },
  { from: "awaiting_payment", to: "awaiting_supervisor_review", actor: "supervisee" },
  { from: "paid", to: "accepted", actor: "supervisor" },
  { from: "awaiting_supervisor_review", to: "in_review", actor: "supervisor" },
  { from: "accepted", to: "feedback_submitted", actor: "supervisor" },
  { from: "in_review", to: "completion_record_issued", actor: "supervisor" },
  { from: "in_review", to: "additional_info_requested", actor: "supervisee" },
  { from: "additional_info_requested", to: "in_review", actor: "supervisor" },
  { from: "completion_record_issued", to: "feedback_submitted", actor: "supervisor" },
  { from: "completed", to: "cancelled", actor: "supervisee" },
  { from: "rejected", to: "accepted", actor: "supervisor" },
  { from: "refunded", to: "paid", actor: "system" },
  { from: "expired", to: "submitted", actor: "supervisee" },
  { from: "cancelled", to: "submitted", actor: "supervisee" },
  { from: "paid", to: "refunded", actor: "supervisee" },
  { from: "awaiting_supervisor_review", to: "cancelled", actor: "supervisor" },
  { from: "in_review", to: "cancelled", actor: "supervisor" },
  { from: "completion_record_issued", to: "cancelled", actor: "admin" },
  { from: "completed", to: "expired", actor: "system" },
  { from: "rejected", to: "completed", actor: "supervisor" }
];

describe("critical path status transitions", () => {
  it.each(flowA)("allows $actor to move $from to $to", ({ from, to, actor }) => {
    expect(canTransition(from, to, actor)).toBe(true);
    expect(() => assertTransition(from, to, actor)).not.toThrow();
  });

  it.each(blocked)("blocks $from to $to by $actor", ({ from, to, actor }) => {
    expect(canTransition(from, to, actor)).toBe(false);
    expect(() => assertTransition(from, to, actor)).toThrow();
  });

  it("reports next supervisor states for accepted requests", () => {
    expect(nextStates("accepted", "supervisor")).toContain("in_review");
  });
});
