export const supervisionStatuses = [
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
  "completion_record_issued",
  "completed",
  "cancelled",
  "refunded",
  "expired",
  "deleted"
] as const;

export type SupervisionStatus = (typeof supervisionStatuses)[number];
export type TransitionActor = "supervisee" | "supervisor" | "admin" | "system";
export type TransitionRule = { to: SupervisionStatus; actor: TransitionActor };

const activeStatuses: SupervisionStatus[] = supervisionStatuses.filter(
  (status) =>
    status !== "completed" &&
    status !== "cancelled" &&
    status !== "refunded" &&
    status !== "expired" &&
    status !== "deleted"
);

export const ALLOWED_TRANSITIONS: Record<SupervisionStatus, TransitionRule[]> = {
  draft: [
    { to: "submitted", actor: "supervisee" },
    { to: "cancelled", actor: "supervisee" },
    { to: "deleted", actor: "supervisee" },
    { to: "deleted", actor: "admin" },
    { to: "expired", actor: "system" }
  ],
  submitted: [
    { to: "awaiting_payment", actor: "supervisee" },
    { to: "awaiting_payment", actor: "system" },
    { to: "cancelled", actor: "supervisee" },
    { to: "cancelled", actor: "admin" },
    { to: "expired", actor: "system" }
  ],
  awaiting_payment: [
    { to: "paid", actor: "system" },
    { to: "cancelled", actor: "supervisee" },
    { to: "expired", actor: "system" }
  ],
  paid: [
    { to: "awaiting_supervisor_review", actor: "system" },
    { to: "refunded", actor: "system" },
    { to: "refunded", actor: "admin" },
    { to: "expired", actor: "system" }
  ],
  awaiting_supervisor_review: [
    { to: "accepted", actor: "supervisor" },
    { to: "rejected", actor: "supervisor" },
    { to: "refunded", actor: "system" },
    { to: "refunded", actor: "admin" },
    { to: "expired", actor: "system" }
  ],
  accepted: [
    { to: "in_review", actor: "supervisor" },
    { to: "cancelled", actor: "admin" },
    { to: "expired", actor: "system" }
  ],
  rejected: [{ to: "expired", actor: "system" }],
  additional_info_requested: [
    { to: "in_review", actor: "supervisee" },
    { to: "expired", actor: "system" }
  ],
  in_review: [
    { to: "additional_info_requested", actor: "supervisor" },
    { to: "feedback_submitted", actor: "supervisor" },
    { to: "expired", actor: "system" }
  ],
  feedback_submitted: [
    { to: "additional_info_requested", actor: "supervisor" },
    { to: "completion_record_issued", actor: "supervisor" },
    { to: "completed", actor: "supervisee" },
    { to: "expired", actor: "system" }
  ],
  meeting_scheduled: [{ to: "expired", actor: "system" }],
  meeting_completed: [{ to: "expired", actor: "system" }],
  completion_record_issued: [
    { to: "completed", actor: "supervisee" },
    { to: "expired", actor: "system" }
  ],
  completed: [],
  cancelled: [],
  refunded: [],
  expired: [],
  deleted: []
};

export class SupervisionTransitionError extends Error {
  readonly code = "invalid_state";

  constructor(
    readonly from: SupervisionStatus,
    readonly to: SupervisionStatus,
    readonly actor: TransitionActor
  ) {
    super(`Cannot transition supervision request from ${from} to ${to} as ${actor}`);
  }
}

export function canTransition(
  from: SupervisionStatus,
  to: SupervisionStatus,
  actor: TransitionActor
): boolean {
  return ALLOWED_TRANSITIONS[from].some(
    (transition) => transition.to === to && transition.actor === actor
  );
}

export function assertTransition(
  from: SupervisionStatus,
  to: SupervisionStatus,
  actor: TransitionActor
): void {
  if (!canTransition(from, to, actor)) {
    throw new SupervisionTransitionError(from, to, actor);
  }
}

export function nextStates(
  from: SupervisionStatus,
  actor: TransitionActor
): SupervisionStatus[] {
  return ALLOWED_TRANSITIONS[from]
    .filter((transition) => transition.actor === actor)
    .map((transition) => transition.to);
}

export function isActiveStatus(status: SupervisionStatus): boolean {
  return activeStatuses.includes(status);
}
