import { hashPassword } from "@csp/shared/auth/password";
import { sql, type SQL } from "drizzle-orm";

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

type DevSeedDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

type SeedLogger = (message: string) => void;

export async function seedDemoData(
  db: DevSeedDatabase,
  log: SeedLogger = () => undefined
): Promise<void> {
  log("Hashing demo password");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await seedTerms(db, log);
  await seedUsers(db, passwordHash, log);
  await seedProfiles(db, log);
  await seedSpecialties(db, log);
  await seedProducts(db, log);
  await seedAvailability(db, log);
  await seedScenarioData(db, log);

  log("Demo seed complete");
}

async function seedTerms(db: DevSeedDatabase, log: SeedLogger): Promise<void> {
  log("Seeding terms_versions");
  await db.execute(sql`
    insert into terms_versions (id, kind, version, content_md, effective_from, is_active)
    values
      (${DEMO_IDS.termsTos}, 'tos', 'v1', 'Demo terms of service', current_date, true),
      (${DEMO_IDS.termsPrivacy}, 'privacy', 'v1', 'Demo privacy policy', current_date, true),
      (${DEMO_IDS.termsSensitive}, 'sensitive', 'v1', 'Demo sensitive data notice', current_date, true)
    on conflict do nothing
  `);
}

async function seedUsers(
  db: DevSeedDatabase,
  passwordHash: string,
  log: SeedLogger
): Promise<void> {
  log("Seeding demo users");
  await db.execute(sql`
    insert into users (
      id,
      email,
      password_hash,
      role,
      totp_enabled,
      email_verified_at,
      status
    ) values
      (${DEMO_IDS.supervisee}, 'supervisee@demo.local', ${passwordHash}, 'supervisee', false, now(), 'active'),
      (${DEMO_IDS.draftAuthor}, 'draft-author@demo.local', ${passwordHash}, 'supervisee', false, now(), 'active'),
      (${DEMO_IDS.approvedSupervisor}, 'approved-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.hiddenSupervisor}, 'hidden-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.admin}, 'admin@demo.local', ${passwordHash}, 'admin', true, now(), 'active'),
      (${DEMO_IDS.traumaSupervisor}, 'trauma-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.childSupervisor}, 'child-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.neuroSupervisor}, 'neuro-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.forensicSupervisor}, 'forensic-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.geriatricSupervisor}, 'geriatric-sup@demo.local', ${passwordHash}, 'supervisor', true, now(), 'active'),
      (${DEMO_IDS.superviseeTwo}, 'case-owner@demo.local', ${passwordHash}, 'supervisee', false, now(), 'active'),
      (${DEMO_IDS.superviseeThree}, 'reviewer@demo.local', ${passwordHash}, 'supervisee', false, now(), 'active')
    on conflict do nothing
  `);
}

async function seedProfiles(db: DevSeedDatabase, log: SeedLogger): Promise<void> {
  log("Seeding supervisor profiles and qualification");
  await db.execute(sql`
    insert into supervisor_profiles (
      id,
      user_id,
      display_name,
      headline,
      bio,
      years_of_experience,
      verification_status,
      verified_at,
      visibility,
      avg_response_minutes,
      total_completed,
      average_rating
    ) values (
      ${DEMO_IDS.approvedSupervisorProfile},
      ${DEMO_IDS.approvedSupervisor},
      '정확한 평가 전문가',
      '성인 정신병리·MMPI·로르샤흐 슈퍼비전',
      '성인 정신병리 평가와 성격평가 보고서 피드백을 중심으로, 근거 기반 해석과 윤리적 문서화를 함께 점검합니다.',
      12,
      'approved',
      now(),
      'public',
      240,
      84,
      '4.70'
    ), (
      ${DEMO_IDS.hiddenSupervisorProfile},
      ${DEMO_IDS.hiddenSupervisor},
      '숨김 프로필 슈퍼바이저',
      '검색 미노출 검증용',
      '데모 검색 결과에서 제외되어야 하는 프로필입니다.',
      5,
      'pending',
      null,
      'hidden',
      null,
      0,
      null
    ), (
      ${DEMO_IDS.traumaSupervisorProfile},
      ${DEMO_IDS.traumaSupervisor},
      '트라우마 평가 동반자',
      '외상·중독·위기 사례 평가 슈퍼비전',
      '복합 외상과 중독 문제가 섞인 평가 장면에서 위험도, 자원, 보고서 문장 톤을 함께 점검합니다.',
      10,
      'approved',
      now(),
      'public',
      180,
      52,
      '4.82'
    ), (
      ${DEMO_IDS.childSupervisorProfile},
      ${DEMO_IDS.childSupervisor},
      '아동 발달 평가가이드',
      '아동·청소년 발달과 학교 장면 평가',
      '아동 발달, 학습 문제, 부모 면담 자료를 연결해 실무자가 설명 가능한 보고서를 만들도록 돕습니다.',
      9,
      'approved',
      now(),
      'public',
      360,
      47,
      '4.63'
    ), (
      ${DEMO_IDS.neuroSupervisorProfile},
      ${DEMO_IDS.neuroSupervisor},
      '신경심리 해석 파트너',
      '인지기능·신경심리 배터리 해석',
      '기억, 주의, 실행기능 결과를 생활 기능과 연결해 의뢰 목적에 맞는 결론을 정리합니다.',
      15,
      'approved',
      now(),
      'public',
      120,
      93,
      '4.91'
    ), (
      ${DEMO_IDS.forensicSupervisorProfile},
      ${DEMO_IDS.forensicSupervisor},
      '법정 평가 문서 코치',
      '법정·감정 맥락의 윤리적 문서화',
      '증거 수준과 한계를 분리해 오해 가능성을 줄이는 보고서 구조를 점검합니다.',
      14,
      'approved',
      now(),
      'public',
      420,
      38,
      '4.55'
    ), (
      ${DEMO_IDS.geriatricSupervisorProfile},
      ${DEMO_IDS.geriatricSupervisor},
      '노년기 평가 컨설턴트',
      '노인·인지저하·보호자 면담 통합',
      '노년기 정서와 인지저하 감별, 보호자 보고와 검사 결과의 불일치 정리를 지원합니다.',
      18,
      'approved',
      now(),
      'public',
      300,
      126,
      '4.88'
    )
    on conflict do nothing
  `);

  await db.execute(sql`
    insert into qualifications (
      id,
      supervisor_profile_id,
      name,
      issuing_body,
      issued_at,
      status,
      verification_note
    ) values (
      ${DEMO_IDS.qualification},
      ${DEMO_IDS.approvedSupervisorProfile},
      '임상심리전문가',
      '한국임상심리학회',
      '2014-03-01',
      'approved',
      'Demo approved qualification'
    ), (
      ${DEMO_IDS.pendingQualification},
      ${DEMO_IDS.hiddenSupervisorProfile},
      '정신건강임상심리사 1급',
      '보건복지부',
      '2018-09-01',
      'pending',
      'Demo pending qualification for admin approval'
    ), (
      ${DEMO_IDS.qualificationTrauma},
      ${DEMO_IDS.traumaSupervisorProfile},
      '정신건강임상심리사 1급',
      '보건복지부',
      '2016-05-01',
      'approved',
      'Demo approved trauma qualification'
    ), (
      ${DEMO_IDS.qualificationChild},
      ${DEMO_IDS.childSupervisorProfile},
      '임상심리전문가',
      '한국임상심리학회',
      '2017-04-01',
      'approved',
      'Demo approved child qualification'
    ), (
      ${DEMO_IDS.qualificationNeuro},
      ${DEMO_IDS.neuroSupervisorProfile},
      '신경심리전문가',
      '한국임상심리학회',
      '2012-03-01',
      'approved',
      'Demo approved neuro qualification'
    ), (
      ${DEMO_IDS.qualificationForensic},
      ${DEMO_IDS.forensicSupervisorProfile},
      '임상심리전문가',
      '한국임상심리학회',
      '2011-03-01',
      'approved',
      'Demo approved forensic qualification'
    ), (
      ${DEMO_IDS.qualificationGeriatric},
      ${DEMO_IDS.geriatricSupervisorProfile},
      '정신건강임상심리사 1급',
      '보건복지부',
      '2009-09-01',
      'approved',
      'Demo approved geriatric qualification'
    )
    on conflict do nothing
  `);
}

async function seedSpecialties(db: DevSeedDatabase, log: SeedLogger): Promise<void> {
  log("Seeding supervisor specialties");
  await db.execute(sql`
    insert into supervisor_specialties (supervisor_profile_id, specialty_id)
    select seed.profile_id::uuid, catalog.id
    from (
      values
        (${DEMO_IDS.approvedSupervisorProfile}, 'adult_psychopathology'),
        (${DEMO_IDS.approvedSupervisorProfile}, 'personality_assessment'),
        (${DEMO_IDS.approvedSupervisorProfile}, 'projective'),
        (${DEMO_IDS.traumaSupervisorProfile}, 'trauma'),
        (${DEMO_IDS.traumaSupervisorProfile}, 'addiction'),
        (${DEMO_IDS.traumaSupervisorProfile}, 'adult_psychopathology'),
        (${DEMO_IDS.childSupervisorProfile}, 'child_psychopathology'),
        (${DEMO_IDS.childSupervisorProfile}, 'autism'),
        (${DEMO_IDS.childSupervisorProfile}, 'learning_disorder'),
        (${DEMO_IDS.neuroSupervisorProfile}, 'neuropsych'),
        (${DEMO_IDS.neuroSupervisorProfile}, 'cognitive_assessment'),
        (${DEMO_IDS.neuroSupervisorProfile}, 'geriatric'),
        (${DEMO_IDS.forensicSupervisorProfile}, 'forensic'),
        (${DEMO_IDS.forensicSupervisorProfile}, 'personality_assessment'),
        (${DEMO_IDS.geriatricSupervisorProfile}, 'geriatric'),
        (${DEMO_IDS.geriatricSupervisorProfile}, 'neuropsych'),
        (${DEMO_IDS.geriatricSupervisorProfile}, 'cognitive_assessment')
    ) as seed(profile_id, code)
    join specialty_catalog catalog on catalog.code = seed.code
    on conflict do nothing
  `);
}

async function seedProducts(db: DevSeedDatabase, log: SeedLogger): Promise<void> {
  log("Seeding service products");
  await db.execute(sql`
    insert into service_products (
      id,
      supervisor_profile_id,
      kind,
      title,
      description,
      price_krw,
      turnaround_hours,
      active
    ) values
      (
        ${DEMO_IDS.productAsync},
        ${DEMO_IDS.approvedSupervisorProfile},
        'async_comment',
        '보고서 코멘트',
        '비식별화된 보고서 초안에 구조화 코멘트를 제공합니다.',
        120000,
        72,
        true
      ),
      (
        ${DEMO_IDS.productDirect},
        ${DEMO_IDS.approvedSupervisorProfile},
        'async_direct_edit',
        '직접 수정 피드백',
        '보고서 문장과 해석 구조를 직접 수정합니다.',
        240000,
        96,
        true
      ),
      (
        ${DEMO_IDS.productZoom},
        ${DEMO_IDS.approvedSupervisorProfile},
        'zoom_90',
        '90분 화상 슈퍼비전',
        '평가자료 해석과 보고서 방향을 실시간으로 논의합니다.',
        360000,
        168,
        true
      ),
      (
        ${DEMO_IDS.productTrauma},
        ${DEMO_IDS.traumaSupervisorProfile},
        'async_comment',
        '외상 사례 보고서 검토',
        '외상 관련 평가결과와 안정화 권고를 함께 검토합니다.',
        150000,
        72,
        true
      ),
      (
        ${DEMO_IDS.productChild},
        ${DEMO_IDS.childSupervisorProfile},
        'zoom_90',
        '아동 평가 90분 회의',
        '아동 발달 정보와 학교 장면 자료를 함께 정리합니다.',
        260000,
        120,
        true
      ),
      (
        ${DEMO_IDS.productNeuro},
        ${DEMO_IDS.neuroSupervisorProfile},
        'async_direct_edit',
        '신경심리 결과 직접 수정',
        '인지 프로파일 문장화와 결론 구조를 다듬습니다.',
        320000,
        96,
        true
      ),
      (
        ${DEMO_IDS.productForensic},
        ${DEMO_IDS.forensicSupervisorProfile},
        'async_comment',
        '법정 평가 의견서 검토',
        '감정 맥락에서 한계와 근거 수준이 드러나는지 검토합니다.',
        280000,
        144,
        true
      ),
      (
        ${DEMO_IDS.productGeriatric},
        ${DEMO_IDS.geriatricSupervisorProfile},
        'zoom_90',
        '노년기 평가 통합 회의',
        '보호자 면담, 인지검사, 정서 평가를 함께 해석합니다.',
        300000,
        168,
        true
      ),
      (
        ${DEMO_IDS.productTraumaZoom},
        ${DEMO_IDS.traumaSupervisorProfile},
        'zoom_60',
        '위기 사례 60분 정리',
        '위험도와 보호요인을 중심으로 구두 자문을 제공합니다.',
        220000,
        72,
        true
      ),
      (
        ${DEMO_IDS.productChildAsync},
        ${DEMO_IDS.childSupervisorProfile},
        'async_comment',
        '아동 보고서 코멘트',
        '발달력과 검사 결과가 자연스럽게 연결되는지 점검합니다.',
        140000,
        96,
        true
      ),
      (
        ${DEMO_IDS.productNeuroZoom},
        ${DEMO_IDS.neuroSupervisorProfile},
        'zoom_90',
        '신경심리 90분 케이스 회의',
        '인지기능 검사 결과와 일상 기능을 함께 해석합니다.',
        380000,
        120,
        true
      ),
      (
        ${DEMO_IDS.productForensicZoom},
        ${DEMO_IDS.forensicSupervisorProfile},
        'zoom_60',
        '법정 문서 쟁점 회의',
        '감정 문서의 제한점과 표현 위험을 검토합니다.',
        260000,
        144,
        true
      ),
      (
        ${DEMO_IDS.productGeriatricAsync},
        ${DEMO_IDS.geriatricSupervisorProfile},
        'async_comment',
        '노년기 평가 코멘트',
        '인지 저하와 정서 문제의 감별 문장을 점검합니다.',
        160000,
        96,
        true
      )
    on conflict do nothing
  `);
}

async function seedAvailability(db: DevSeedDatabase, log: SeedLogger): Promise<void> {
  log("Seeding availability slots");
  await db.execute(sql`
    insert into availability_slots (
      id,
      supervisor_profile_id,
      weekday,
      start_time,
      end_time,
      timezone
    ) values
      (${DEMO_IDS.slotMonday}, ${DEMO_IDS.approvedSupervisorProfile}, 1, '10:00', '12:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotWednesday}, ${DEMO_IDS.approvedSupervisorProfile}, 3, '14:00', '17:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotFriday}, ${DEMO_IDS.approvedSupervisorProfile}, 5, '09:00', '11:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotTraumaMonday}, ${DEMO_IDS.traumaSupervisorProfile}, 1, '13:00', '15:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotTraumaThursday}, ${DEMO_IDS.traumaSupervisorProfile}, 4, '10:00', '12:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotTraumaSaturday}, ${DEMO_IDS.traumaSupervisorProfile}, 6, '09:00', '11:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotChildTuesday}, ${DEMO_IDS.childSupervisorProfile}, 2, '09:00', '12:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotChildWednesday}, ${DEMO_IDS.childSupervisorProfile}, 3, '16:00', '18:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotChildFriday}, ${DEMO_IDS.childSupervisorProfile}, 5, '13:00', '15:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotNeuroMonday}, ${DEMO_IDS.neuroSupervisorProfile}, 1, '08:30', '10:30', 'Asia/Seoul'),
      (${DEMO_IDS.slotNeuroWednesday}, ${DEMO_IDS.neuroSupervisorProfile}, 3, '10:00', '12:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotNeuroFriday}, ${DEMO_IDS.neuroSupervisorProfile}, 5, '15:00', '17:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotForensicTuesday}, ${DEMO_IDS.forensicSupervisorProfile}, 2, '14:00', '16:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotForensicThursday}, ${DEMO_IDS.forensicSupervisorProfile}, 4, '15:00', '17:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotForensicFriday}, ${DEMO_IDS.forensicSupervisorProfile}, 5, '10:00', '12:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotGeriatricMonday}, ${DEMO_IDS.geriatricSupervisorProfile}, 1, '11:00', '13:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotGeriatricTuesday}, ${DEMO_IDS.geriatricSupervisorProfile}, 2, '15:00', '17:00', 'Asia/Seoul'),
      (${DEMO_IDS.slotGeriatricThursday}, ${DEMO_IDS.geriatricSupervisorProfile}, 4, '09:00', '11:00', 'Asia/Seoul')
    on conflict do nothing
  `);
}

async function seedScenarioData(db: DevSeedDatabase, log: SeedLogger): Promise<void> {
  log("Seeding supervision request scenario data");
  await db.execute(sql`
    insert into supervision_requests (
      id,
      supervisee_id,
      supervisor_id,
      service_product_id,
      status,
      retention_days,
      retention_expires_at,
      urgency
    ) values
      (${DEMO_IDS.requestDraft}, ${DEMO_IDS.draftAuthor}, ${DEMO_IDS.approvedSupervisor}, ${DEMO_IDS.productAsync}, 'draft', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestSubmitted}, ${DEMO_IDS.superviseeTwo}, ${DEMO_IDS.approvedSupervisor}, ${DEMO_IDS.productAsync}, 'submitted', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestAwaitingPayment}, ${DEMO_IDS.superviseeTwo}, ${DEMO_IDS.approvedSupervisor}, ${DEMO_IDS.productAsync}, 'awaiting_payment', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestPaid}, ${DEMO_IDS.superviseeTwo}, ${DEMO_IDS.approvedSupervisor}, ${DEMO_IDS.productDirect}, 'paid', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestInReview}, ${DEMO_IDS.superviseeThree}, ${DEMO_IDS.neuroSupervisor}, ${DEMO_IDS.productNeuro}, 'in_review', 30, now() + interval '30 days', 'urgent_24h'),
      (${DEMO_IDS.requestFeedback}, ${DEMO_IDS.superviseeThree}, ${DEMO_IDS.traumaSupervisor}, ${DEMO_IDS.productTrauma}, 'feedback_submitted', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestCompletion}, ${DEMO_IDS.supervisee}, ${DEMO_IDS.childSupervisor}, ${DEMO_IDS.productChild}, 'completion_record_issued', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestCompleted}, ${DEMO_IDS.supervisee}, ${DEMO_IDS.approvedSupervisor}, ${DEMO_IDS.productZoom}, 'completed', 30, now() + interval '30 days', 'normal'),
      (${DEMO_IDS.requestRejected}, ${DEMO_IDS.draftAuthor}, ${DEMO_IDS.forensicSupervisor}, ${DEMO_IDS.productForensic}, 'rejected', 30, now() + interval '30 days', 'normal')
    on conflict do nothing
  `);

  await db.execute(sql`
    insert into payments (
      id,
      supervision_request_id,
      amount_krw,
      platform_fee_krw,
      supervisor_net_krw,
      pg_order_id,
      pg_payment_key,
      status,
      paid_at
    ) values (
      ${DEMO_IDS.paymentPaid},
      ${DEMO_IDS.requestCompleted},
      360000,
      72000,
      288000,
      'demo-completed-order',
      'demo-completed-payment-key',
      'paid',
      now() - interval '5 days'
    )
    on conflict do nothing
  `);

  await db.execute(sql`
    insert into reviews (
      id,
      supervision_request_id,
      supervisor_id,
      supervisee_id,
      expertise,
      specificity,
      helpfulness,
      ethics,
      response_speed,
      on_time,
      educational,
      reuse_intent,
      free_text
    ) values
      (${DEMO_IDS.reviewOne}, ${DEMO_IDS.requestCompleted}, ${DEMO_IDS.approvedSupervisor}, ${DEMO_IDS.supervisee}, 5, 5, 5, 5, 4, 5, 5, 5, '보고서 결론 구조가 명확해졌습니다.'),
      (${DEMO_IDS.reviewTwo}, ${DEMO_IDS.requestCompletion}, ${DEMO_IDS.childSupervisor}, ${DEMO_IDS.supervisee}, 4, 5, 4, 5, 4, 4, 5, 4, '아동 자료 통합 방향을 잡는 데 도움이 됐습니다.'),
      (${DEMO_IDS.reviewThree}, ${DEMO_IDS.requestInReview}, ${DEMO_IDS.neuroSupervisor}, ${DEMO_IDS.superviseeThree}, 5, 4, 5, 5, 5, 4, 5, 5, '인지 프로파일 해석이 훨씬 선명해졌습니다.')
    on conflict do nothing
  `);
}
