import type { UserRole } from "./context";

export const DEMO_PASSWORD = "DemoPass!23";

export const DEMO_IDS = {
  supervisee: "10000000-0000-4000-8000-000000000001",
  draftAuthor: "10000000-0000-4000-8000-000000000002",
  approvedSupervisor: "10000000-0000-4000-8000-000000000003",
  hiddenSupervisor: "10000000-0000-4000-8000-000000000004",
  admin: "10000000-0000-4000-8000-000000000005",
  traumaSupervisor: "10000000-0000-4000-8000-000000000006",
  childSupervisor: "10000000-0000-4000-8000-000000000007",
  neuroSupervisor: "10000000-0000-4000-8000-000000000008",
  forensicSupervisor: "10000000-0000-4000-8000-000000000009",
  geriatricSupervisor: "10000000-0000-4000-8000-000000000010",
  superviseeTwo: "10000000-0000-4000-8000-000000000011",
  superviseeThree: "10000000-0000-4000-8000-000000000012",
  approvedSupervisorProfile: "10000000-0000-4000-8000-000000000101",
  hiddenSupervisorProfile: "10000000-0000-4000-8000-000000000102",
  traumaSupervisorProfile: "10000000-0000-4000-8000-000000000103",
  childSupervisorProfile: "10000000-0000-4000-8000-000000000104",
  neuroSupervisorProfile: "10000000-0000-4000-8000-000000000105",
  forensicSupervisorProfile: "10000000-0000-4000-8000-000000000106",
  geriatricSupervisorProfile: "10000000-0000-4000-8000-000000000107",
  qualification: "10000000-0000-4000-8000-000000000201",
  pendingQualification: "10000000-0000-4000-8000-000000000202",
  qualificationTrauma: "10000000-0000-4000-8000-000000000203",
  qualificationChild: "10000000-0000-4000-8000-000000000204",
  qualificationNeuro: "10000000-0000-4000-8000-000000000205",
  qualificationForensic: "10000000-0000-4000-8000-000000000206",
  qualificationGeriatric: "10000000-0000-4000-8000-000000000207",
  productAsync: "10000000-0000-4000-8000-000000000301",
  productDirect: "10000000-0000-4000-8000-000000000302",
  productZoom: "10000000-0000-4000-8000-000000000303",
  productTrauma: "10000000-0000-4000-8000-000000000304",
  productChild: "10000000-0000-4000-8000-000000000305",
  productNeuro: "10000000-0000-4000-8000-000000000306",
  productForensic: "10000000-0000-4000-8000-000000000307",
  productGeriatric: "10000000-0000-4000-8000-000000000308",
  productTraumaZoom: "10000000-0000-4000-8000-000000000309",
  productChildAsync: "10000000-0000-4000-8000-000000000310",
  productNeuroZoom: "10000000-0000-4000-8000-000000000311",
  productForensicZoom: "10000000-0000-4000-8000-000000000312",
  productGeriatricAsync: "10000000-0000-4000-8000-000000000313",
  slotMonday: "10000000-0000-4000-8000-000000000401",
  slotWednesday: "10000000-0000-4000-8000-000000000402",
  slotFriday: "10000000-0000-4000-8000-000000000403",
  slotTraumaMonday: "10000000-0000-4000-8000-000000000404",
  slotTraumaThursday: "10000000-0000-4000-8000-000000000405",
  slotTraumaSaturday: "10000000-0000-4000-8000-000000000406",
  slotChildTuesday: "10000000-0000-4000-8000-000000000407",
  slotChildWednesday: "10000000-0000-4000-8000-000000000408",
  slotChildFriday: "10000000-0000-4000-8000-000000000409",
  slotNeuroMonday: "10000000-0000-4000-8000-000000000410",
  slotNeuroWednesday: "10000000-0000-4000-8000-000000000411",
  slotNeuroFriday: "10000000-0000-4000-8000-000000000412",
  slotForensicTuesday: "10000000-0000-4000-8000-000000000413",
  slotForensicThursday: "10000000-0000-4000-8000-000000000414",
  slotForensicFriday: "10000000-0000-4000-8000-000000000415",
  slotGeriatricMonday: "10000000-0000-4000-8000-000000000416",
  slotGeriatricTuesday: "10000000-0000-4000-8000-000000000417",
  slotGeriatricThursday: "10000000-0000-4000-8000-000000000418",
  termsTos: "10000000-0000-4000-8000-000000000501",
  termsPrivacy: "10000000-0000-4000-8000-000000000502",
  termsSensitive: "10000000-0000-4000-8000-000000000503",
  requestDraft: "10000000-0000-4000-8000-000000000601",
  requestSubmitted: "10000000-0000-4000-8000-000000000602",
  requestAwaitingPayment: "10000000-0000-4000-8000-000000000603",
  requestPaid: "10000000-0000-4000-8000-000000000604",
  requestInReview: "10000000-0000-4000-8000-000000000605",
  requestFeedback: "10000000-0000-4000-8000-000000000606",
  requestCompletion: "10000000-0000-4000-8000-000000000607",
  requestCompleted: "10000000-0000-4000-8000-000000000608",
  requestRejected: "10000000-0000-4000-8000-000000000609",
  paymentPaid: "10000000-0000-4000-8000-000000000701",
  reviewOne: "10000000-0000-4000-8000-000000000801",
  reviewTwo: "10000000-0000-4000-8000-000000000802",
  reviewThree: "10000000-0000-4000-8000-000000000803"
} as const;

export type DemoAuthAccount = {
  email: string;
  id: string;
  role: UserRole;
  totpEnabled: boolean;
};

export const DEMO_AUTH_ACCOUNTS = [
  {
    email: "supervisee@demo.local",
    id: DEMO_IDS.supervisee,
    role: "supervisee",
    totpEnabled: false
  },
  {
    email: "draft-author@demo.local",
    id: DEMO_IDS.draftAuthor,
    role: "supervisee",
    totpEnabled: false
  },
  {
    email: "approved-sup@demo.local",
    id: DEMO_IDS.approvedSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "hidden-sup@demo.local",
    id: DEMO_IDS.hiddenSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "admin@demo.local",
    id: DEMO_IDS.admin,
    role: "admin",
    totpEnabled: true
  },
  {
    email: "trauma-sup@demo.local",
    id: DEMO_IDS.traumaSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "child-sup@demo.local",
    id: DEMO_IDS.childSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "neuro-sup@demo.local",
    id: DEMO_IDS.neuroSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "forensic-sup@demo.local",
    id: DEMO_IDS.forensicSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "geriatric-sup@demo.local",
    id: DEMO_IDS.geriatricSupervisor,
    role: "supervisor",
    totpEnabled: true
  },
  {
    email: "case-owner@demo.local",
    id: DEMO_IDS.superviseeTwo,
    role: "supervisee",
    totpEnabled: false
  },
  {
    email: "reviewer@demo.local",
    id: DEMO_IDS.superviseeThree,
    role: "supervisee",
    totpEnabled: false
  }
] as const satisfies readonly DemoAuthAccount[];
