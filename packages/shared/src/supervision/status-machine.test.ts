import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  nextStates,
  supervisionStatuses,
  type SupervisionStatus
} from "./status-machine";

describe("supervision status machine", () => {
  it("allows supervisees to submit, cancel, or delete drafts", () => {
    expect(canTransition("draft", "submitted", "supervisee")).toBe(true);
    expect(canTransition("draft", "cancelled", "supervisee")).toBe(true);
    expect(canTransition("draft", "deleted", "supervisee")).toBe(true);
    expect(nextStates("draft", "supervisee")).toEqual([
      "submitted",
      "cancelled",
      "deleted"
    ]);
  });

  it("allows submitted cancellation only for supervisee or admin", () => {
    expect(canTransition("submitted", "cancelled", "supervisee")).toBe(true);
    expect(canTransition("submitted", "cancelled", "admin")).toBe(true);
    expect(canTransition("submitted", "cancelled", "supervisor")).toBe(false);
  });

  it("allows payment-stage transitions for EPIC 6 actors", () => {
    expect(canTransition("submitted", "awaiting_payment", "supervisee")).toBe(true);
    expect(canTransition("submitted", "awaiting_payment", "system")).toBe(true);
    expect(canTransition("awaiting_payment", "paid", "system")).toBe(true);
    expect(canTransition("awaiting_payment", "cancelled", "supervisee")).toBe(true);
    expect(canTransition("paid", "awaiting_supervisor_review", "system")).toBe(true);
    expect(canTransition("paid", "refunded", "system")).toBe(true);
    expect(canTransition("paid", "refunded", "admin")).toBe(true);
    expect(canTransition("awaiting_supervisor_review", "refunded", "system")).toBe(
      true
    );
    expect(canTransition("awaiting_supervisor_review", "refunded", "admin")).toBe(true);
  });

  it("rejects payment transitions by the wrong actor or state", () => {
    expect(canTransition("submitted", "awaiting_payment", "supervisor")).toBe(false);
    expect(canTransition("awaiting_payment", "paid", "supervisee")).toBe(false);
    expect(canTransition("paid", "awaiting_supervisor_review", "supervisee")).toBe(
      false
    );
    expect(canTransition("awaiting_supervisor_review", "paid", "system")).toBe(false);
    expect(canTransition("cancelled", "refunded", "admin")).toBe(false);
  });

  it("allows Flow A supervisor workflow transitions", () => {
    expect(canTransition("awaiting_supervisor_review", "accepted", "supervisor")).toBe(
      true
    );
    expect(canTransition("awaiting_supervisor_review", "rejected", "supervisor")).toBe(
      true
    );
    expect(canTransition("accepted", "in_review", "supervisor")).toBe(true);
    expect(canTransition("in_review", "additional_info_requested", "supervisor")).toBe(
      true
    );
    expect(canTransition("additional_info_requested", "in_review", "supervisee")).toBe(
      true
    );
    expect(canTransition("in_review", "feedback_submitted", "supervisor")).toBe(true);
    expect(
      canTransition("feedback_submitted", "additional_info_requested", "supervisor")
    ).toBe(true);
    expect(
      canTransition("feedback_submitted", "completion_record_issued", "supervisor")
    ).toBe(true);
    expect(canTransition("feedback_submitted", "completed", "supervisee")).toBe(true);
    expect(canTransition("completion_record_issued", "completed", "supervisee")).toBe(
      true
    );
  });

  it("rejects Flow A workflow transitions by non-participant actors", () => {
    expect(canTransition("awaiting_supervisor_review", "accepted", "supervisee")).toBe(
      false
    );
    expect(canTransition("accepted", "in_review", "supervisee")).toBe(false);
    expect(canTransition("in_review", "feedback_submitted", "supervisee")).toBe(false);
    expect(canTransition("in_review", "additional_info_requested", "supervisee")).toBe(
      false
    );
    expect(canTransition("additional_info_requested", "in_review", "supervisor")).toBe(
      false
    );
    expect(
      canTransition("feedback_submitted", "completion_record_issued", "supervisee")
    ).toBe(false);
    expect(canTransition("completion_record_issued", "completed", "supervisor")).toBe(
      false
    );
    expect(canTransition("completed", "cancelled", "admin")).toBe(false);
  });

  it("allows system expiry for active statuses", () => {
    const activeStatuses: SupervisionStatus[] = [
      "draft",
      "submitted",
      "awaiting_payment",
      "paid",
      "awaiting_supervisor_review",
      "accepted",
      "rejected",
      "additional_info_requested",
      "in_review",
      "feedback_submitted",
      "meeting_scheduled",
      "meeting_completed",
      "completion_record_issued"
    ];

    for (const status of activeStatuses) {
      expect(canTransition(status, "expired", "system")).toBe(true);
    }
  });

  it("rejects out-of-scope or terminal transitions", () => {
    expect(() => assertTransition("draft", "accepted", "supervisee")).toThrow(
      "Cannot transition"
    );
    expect(canTransition("cancelled", "submitted", "supervisee")).toBe(false);
    expect(canTransition("completed", "expired", "system")).toBe(false);
  });

  it("keeps every status covered by the transition map", () => {
    for (const status of supervisionStatuses) {
      expect(() => nextStates(status, "supervisee")).not.toThrow();
    }
  });
});
