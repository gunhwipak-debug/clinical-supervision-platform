import { decryptPhi, encryptPhi } from "@csp/shared/crypto/phi";
import { sql, type SQL } from "drizzle-orm";

export type ServiceProductKind =
  | "async_comment"
  | "async_direct_edit"
  | "zoom_60"
  | "zoom_90"
  | "urgent_24h";

export type SupervisorProfileInput = {
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
};

export type SupervisorProfile = SupervisorProfileInput & {
  id: string;
  userId: string;
  verificationStatus: "pending" | "approved" | "rejected" | "revoked";
  verifiedAt: Date | string | null;
  visibility: "hidden" | "public" | "private";
  avgResponseMinutes: number | null;
  totalCompleted: number;
  averageRating: string | null;
};

export type Qualification = {
  id: string;
  supervisorProfileId: string;
  name: string;
  number: string | null;
  issuingBody: string | null;
  issuedAt: Date | string | null;
  expiresAt: Date | string | null;
  evidenceFileId: string | null;
  evidenceOriginalFilename: string | null;
  evidenceMimeType: string | null;
  evidenceSizeBytes: number | null;
  evidenceUploadedAt: Date | string | null;
  evidenceVirusScanStatus: "clean" | "infected" | "error" | null;
  verificationNote: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date | string;
};

export type QualificationEvidenceFile = {
  id: string;
  supervisorProfileId: string;
  uploadedBy: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksumSha256: string | null;
  virusScanStatus: "clean" | "infected" | "error";
  uploadedAt: Date | string;
};

export type QualificationReviewReadiness =
  | "ready"
  | "not_found"
  | "invalid_state"
  | "missing_evidence";

export type Specialty = {
  id: string;
  code: string;
  labelKo: string;
  displayOrder: number | null;
  active: boolean;
};

export type ProductInput = {
  kind: ServiceProductKind;
  title: string;
  description: string | null;
  priceKrw: number;
  turnaroundHours: number | null;
};

export type Product = ProductInput & {
  id: string;
  supervisorProfileId: string;
  active: boolean;
  createdAt: Date | string;
};

export type AvailabilitySlotInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
};

export type AvailabilitySlot = AvailabilitySlotInput & {
  id: string;
  supervisorProfileId: string;
};

export type PublicAvailabilitySlot = AvailabilitySlot;

export type SuperviseeProfileInput = {
  displayName: string;
  headline: string | null;
};

export type SuperviseeProfile = SuperviseeProfileInput & {
  id: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type PublicSupervisor = {
  id: string;
  userId: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  avgResponseMinutes: number | null;
  totalCompleted: number;
  averageRating: string | null;
  serviceProducts: unknown;
  specialties: string[];
};

type PublicSupervisorRow = Omit<PublicSupervisor, "serviceProducts" | "specialties">;

type PublicServiceProduct = {
  supervisorProfileId: string;
  id: string;
  kind: string;
  title: string;
  description?: string | null;
  priceKrw: number;
  turnaroundHours: number | null;
};

type ProfileDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function getSupervisorProfileByUserId(
  db: ProfileDatabase,
  userId: string
): Promise<SupervisorProfile | null> {
  const result = await db.execute(sql`
    select
      id,
      user_id as "userId",
      display_name as "displayName",
      photo_url as "photoUrl",
      headline,
      bio,
      years_of_experience as "yearsOfExperience",
      verification_status as "verificationStatus",
      verified_at as "verifiedAt",
      visibility,
      avg_response_minutes as "avgResponseMinutes",
      total_completed as "totalCompleted",
      average_rating as "averageRating"
    from supervisor_profiles
    where user_id = ${userId}
    limit 1
  `);

  return rowsOf<SupervisorProfile>(result)[0] ?? null;
}

export async function startSupervisorApplication(
  db: ProfileDatabase,
  input: { userId: string; displayName: string }
): Promise<SupervisorProfile> {
  await db.execute(sql`
    update users
    set role = 'supervisor', updated_at = now()
    where id = ${input.userId}
      and role in ('supervisee', 'supervisor')
  `);

  const result = await db.execute(sql`
    insert into supervisor_profiles (
      user_id,
      display_name,
      verification_status,
      visibility
    ) values (
      ${input.userId},
      ${input.displayName},
      'pending',
      'hidden'
    )
    on conflict (user_id) do update
    set updated_at = now()
    returning
      id,
      user_id as "userId",
      display_name as "displayName",
      photo_url as "photoUrl",
      headline,
      bio,
      years_of_experience as "yearsOfExperience",
      verification_status as "verificationStatus",
      verified_at as "verifiedAt",
      visibility,
      avg_response_minutes as "avgResponseMinutes",
      total_completed as "totalCompleted",
      average_rating as "averageRating"
  `);
  const profile = rowsOf<SupervisorProfile>(result)[0];

  if (!profile) {
    throw new Error("Failed to start supervisor application");
  }

  return profile;
}

export async function upsertSupervisorProfile(
  db: ProfileDatabase,
  userId: string,
  input: SupervisorProfileInput
): Promise<SupervisorProfile> {
  const result = await db.execute(sql`
    insert into supervisor_profiles (
      user_id,
      display_name,
      photo_url,
      headline,
      bio,
      years_of_experience
    ) values (
      ${userId},
      ${input.displayName},
      ${input.photoUrl},
      ${input.headline},
      ${input.bio},
      ${input.yearsOfExperience}
    )
    on conflict (user_id) do update
    set
      display_name = excluded.display_name,
      photo_url = excluded.photo_url,
      headline = excluded.headline,
      bio = excluded.bio,
      years_of_experience = excluded.years_of_experience,
      updated_at = now()
    returning
      id,
      user_id as "userId",
      display_name as "displayName",
      photo_url as "photoUrl",
      headline,
      bio,
      years_of_experience as "yearsOfExperience",
      verification_status as "verificationStatus",
      verified_at as "verifiedAt",
      visibility,
      avg_response_minutes as "avgResponseMinutes",
      total_completed as "totalCompleted",
      average_rating as "averageRating"
  `);
  const profile = rowsOf<SupervisorProfile>(result)[0];

  if (!profile) {
    throw new Error("Failed to upsert supervisor profile");
  }

  return profile;
}

export async function setSupervisorVisibility(
  db: ProfileDatabase,
  userId: string,
  visibility: "hidden" | "public" | "private"
): Promise<SupervisorProfile | null> {
  const result = await db.execute(sql`
    update supervisor_profiles
    set visibility = ${visibility}, updated_at = now()
    where user_id = ${userId}
    returning
      id,
      user_id as "userId",
      display_name as "displayName",
      photo_url as "photoUrl",
      headline,
      bio,
      years_of_experience as "yearsOfExperience",
      verification_status as "verificationStatus",
      verified_at as "verifiedAt",
      visibility,
      avg_response_minutes as "avgResponseMinutes",
      total_completed as "totalCompleted",
      average_rating as "averageRating"
  `);

  return rowsOf<SupervisorProfile>(result)[0] ?? null;
}

export async function getSupervisorProfileIdForUser(
  db: ProfileDatabase,
  userId: string
): Promise<string | null> {
  const result = await db.execute(sql`
    select id
    from supervisor_profiles
    where user_id = ${userId}
    limit 1
  `);

  return rowsOf<{ id: string }>(result)[0]?.id ?? null;
}

export async function listQualifications(
  db: ProfileDatabase,
  userId: string
): Promise<Qualification[]> {
  const result = await db.execute(sql`
    select
      q.id,
      q.supervisor_profile_id as "supervisorProfileId",
      q.name,
      case
        when q.number_enc is null
          or nullif(current_setting('app.phi_key', true), '') is null
        then null
        else ${decryptPhi(sql`q.number_enc`)}
      end as "number",
      q.issuing_body as "issuingBody",
      q.issued_at as "issuedAt",
      q.expires_at as "expiresAt",
      q.evidence_file_id as "evidenceFileId",
      ef.original_filename as "evidenceOriginalFilename",
      ef.mime_type as "evidenceMimeType",
      ef.size_bytes as "evidenceSizeBytes",
      ef.uploaded_at as "evidenceUploadedAt",
      ef.virus_scan_status as "evidenceVirusScanStatus",
      q.verification_note as "verificationNote",
      q.status,
      q.created_at as "createdAt"
    from qualifications q
    join supervisor_profiles sp on sp.id = q.supervisor_profile_id
    left join qualification_evidence_files ef on ef.id = q.evidence_file_id
    where sp.user_id = ${userId}
    order by q.created_at desc
  `);

  return rowsOf<Qualification>(result);
}

export async function createQualificationEvidenceFile(
  db: ProfileDatabase,
  input: {
    userId: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    checksumSha256: string | null;
    virusScanStatus: "clean" | "infected" | "error";
  }
): Promise<QualificationEvidenceFile | null> {
  const result = await db.execute(sql`
    insert into qualification_evidence_files (
      supervisor_profile_id,
      uploaded_by,
      original_filename,
      mime_type,
      size_bytes,
      storage_key,
      checksum_sha256,
      virus_scan_status
    )
    select
      sp.id,
      ${input.userId},
      ${input.originalFilename},
      ${input.mimeType},
      ${input.sizeBytes},
      ${input.storageKey},
      ${input.checksumSha256},
      ${input.virusScanStatus}
    from supervisor_profiles sp
    where sp.user_id = ${input.userId}
    returning
      id,
      supervisor_profile_id as "supervisorProfileId",
      uploaded_by as "uploadedBy",
      original_filename as "originalFilename",
      mime_type as "mimeType",
      size_bytes as "sizeBytes",
      storage_key as "storageKey",
      checksum_sha256 as "checksumSha256",
      virus_scan_status as "virusScanStatus",
      uploaded_at as "uploadedAt"
  `);

  return rowsOf<QualificationEvidenceFile>(result)[0] ?? null;
}

export async function getQualificationEvidenceFile(
  db: ProfileDatabase,
  evidenceFileId: string
): Promise<QualificationEvidenceFile | null> {
  const result = await db.execute(sql`
    select
      id,
      supervisor_profile_id as "supervisorProfileId",
      uploaded_by as "uploadedBy",
      original_filename as "originalFilename",
      mime_type as "mimeType",
      size_bytes as "sizeBytes",
      storage_key as "storageKey",
      checksum_sha256 as "checksumSha256",
      virus_scan_status as "virusScanStatus",
      uploaded_at as "uploadedAt"
    from qualification_evidence_files
    where id = ${evidenceFileId}
    limit 1
  `);

  return rowsOf<QualificationEvidenceFile>(result)[0] ?? null;
}

export async function createQualification(
  db: ProfileDatabase,
  input: {
    supervisorProfileId: string;
    name: string;
    number: string | null;
    issuingBody: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    evidenceFileId: string | null;
  }
): Promise<Qualification> {
  const result = await db.execute(sql`
    insert into qualifications (
      supervisor_profile_id,
      name,
      number_enc,
      issuing_body,
      issued_at,
      expires_at,
      evidence_file_id,
      status
    ) values (
      ${input.supervisorProfileId},
      ${input.name},
      ${input.number ? encryptPhi(input.number) : sql`null`},
      ${input.issuingBody},
      ${input.issuedAt},
      ${input.expiresAt},
      ${input.evidenceFileId},
      'pending'
    )
    returning
      id,
      supervisor_profile_id as "supervisorProfileId",
      name,
      ${input.number ?? null}::text as "number",
      issuing_body as "issuingBody",
      issued_at as "issuedAt",
      expires_at as "expiresAt",
      evidence_file_id as "evidenceFileId",
      null::text as "evidenceOriginalFilename",
      null::text as "evidenceMimeType",
      null::int as "evidenceSizeBytes",
      null::timestamptz as "evidenceUploadedAt",
      null::text as "evidenceVirusScanStatus",
      verification_note as "verificationNote",
      status,
      created_at as "createdAt"
  `);
  const qualification = rowsOf<Qualification>(result)[0];

  if (!qualification) {
    throw new Error("Failed to create qualification");
  }

  return qualification;
}

export async function deletePendingQualification(
  db: ProfileDatabase,
  userId: string,
  qualificationId: string
): Promise<boolean> {
  const result = await db.execute(sql`
    delete from qualifications q
    using supervisor_profiles sp
    where q.supervisor_profile_id = sp.id
      and sp.user_id = ${userId}
      and q.id = ${qualificationId}
      and q.status = 'pending'
    returning q.id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

export async function listSelectedSpecialties(
  db: ProfileDatabase,
  userId: string
): Promise<Specialty[]> {
  const result = await db.execute(sql`
    select sc.id, sc.code, sc.label_ko as "labelKo", sc.display_order as "displayOrder", sc.active
    from supervisor_specialties ss
    join supervisor_profiles sp on sp.id = ss.supervisor_profile_id
    join specialty_catalog sc on sc.id = ss.specialty_id
    where sp.user_id = ${userId}
    order by sc.display_order nulls last, sc.code
  `);

  return rowsOf<Specialty>(result);
}

export async function replaceSelectedSpecialties(
  db: ProfileDatabase,
  input: { userId: string; codes: string[] }
): Promise<Specialty[]> {
  const profileId = await getSupervisorProfileIdForUser(db, input.userId);

  if (!profileId) {
    return [];
  }

  await db.execute(sql`
    delete from supervisor_specialties
    where supervisor_profile_id = ${profileId}
  `);

  if (input.codes.length > 0) {
    const codeValues = sql.join(
      input.codes.map((code) => sql`${code}`),
      sql`, `
    );
    await db.execute(sql`
      insert into supervisor_specialties (supervisor_profile_id, specialty_id)
      select ${profileId}, id
      from specialty_catalog
      where active = true
        and code in (${codeValues})
      on conflict do nothing
    `);
  }

  return listSelectedSpecialties(db, input.userId);
}

export async function listProducts(
  db: ProfileDatabase,
  userId: string
): Promise<Product[]> {
  const result = await db.execute(sql`
    select
      p.id,
      p.supervisor_profile_id as "supervisorProfileId",
      p.kind,
      p.title,
      p.description,
      p.price_krw as "priceKrw",
      p.turnaround_hours as "turnaroundHours",
      p.active,
      p.created_at as "createdAt"
    from service_products p
    join supervisor_profiles sp on sp.id = p.supervisor_profile_id
    where sp.user_id = ${userId}
    order by p.created_at desc
  `);

  return rowsOf<Product>(result);
}

export async function createProduct(
  db: ProfileDatabase,
  input: ProductInput & { supervisorProfileId: string }
): Promise<Product> {
  const result = await db.execute(sql`
    insert into service_products (
      supervisor_profile_id,
      kind,
      title,
      description,
      price_krw,
      turnaround_hours
    ) values (
      ${input.supervisorProfileId},
      ${input.kind},
      ${input.title},
      ${input.description},
      ${input.priceKrw},
      ${input.turnaroundHours}
    )
    returning
      id,
      supervisor_profile_id as "supervisorProfileId",
      kind,
      title,
      description,
      price_krw as "priceKrw",
      turnaround_hours as "turnaroundHours",
      active,
      created_at as "createdAt"
  `);
  const product = rowsOf<Product>(result)[0];

  if (!product) {
    throw new Error("Failed to create product");
  }

  return product;
}

export async function updateProduct(
  db: ProfileDatabase,
  input: ProductInput & { userId: string; productId: string }
): Promise<Product | null> {
  const result = await db.execute(sql`
    update service_products p
    set
      kind = ${input.kind},
      title = ${input.title},
      description = ${input.description},
      price_krw = ${input.priceKrw},
      turnaround_hours = ${input.turnaroundHours}
    from supervisor_profiles sp
    where sp.id = p.supervisor_profile_id
      and sp.user_id = ${input.userId}
      and p.id = ${input.productId}
    returning
      p.id,
      p.supervisor_profile_id as "supervisorProfileId",
      p.kind,
      p.title,
      p.description,
      p.price_krw as "priceKrw",
      p.turnaround_hours as "turnaroundHours",
      p.active,
      p.created_at as "createdAt"
  `);

  return rowsOf<Product>(result)[0] ?? null;
}

export async function deactivateProduct(
  db: ProfileDatabase,
  input: { userId: string; productId: string }
): Promise<boolean> {
  const result = await db.execute(sql`
    update service_products p
    set active = false
    from supervisor_profiles sp
    where sp.id = p.supervisor_profile_id
      and sp.user_id = ${input.userId}
      and p.id = ${input.productId}
    returning p.id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

export async function listAvailability(
  db: ProfileDatabase,
  userId: string
): Promise<AvailabilitySlot[]> {
  const result = await db.execute(sql`
    select
      a.id,
      a.supervisor_profile_id as "supervisorProfileId",
      a.weekday,
      to_char(a.start_time, 'HH24:MI') as "startTime",
      to_char(a.end_time, 'HH24:MI') as "endTime",
      a.timezone
    from availability_slots a
    join supervisor_profiles sp on sp.id = a.supervisor_profile_id
    where sp.user_id = ${userId}
    order by a.weekday, a.start_time
  `);

  return rowsOf<AvailabilitySlot>(result);
}

export async function listPublicAvailabilityForProfile(
  db: ProfileDatabase,
  supervisorProfileId: string
): Promise<PublicAvailabilitySlot[]> {
  const result = await db.execute(sql`
    select
      a.id,
      a.supervisor_profile_id as "supervisorProfileId",
      a.weekday,
      to_char(a.start_time, 'HH24:MI') as "startTime",
      to_char(a.end_time, 'HH24:MI') as "endTime",
      a.timezone
    from availability_slots a
    join supervisor_profiles sp on sp.id = a.supervisor_profile_id
    where a.supervisor_profile_id = ${supervisorProfileId}
      and sp.visibility = 'public'
      and sp.verification_status = 'approved'
    order by a.weekday, a.start_time
  `);

  return rowsOf<PublicAvailabilitySlot>(result);
}

export async function replaceAvailability(
  db: ProfileDatabase,
  input: { userId: string; slots: AvailabilitySlotInput[] }
): Promise<AvailabilitySlot[]> {
  const profileId = await getSupervisorProfileIdForUser(db, input.userId);

  if (!profileId) {
    return [];
  }

  await db.execute(sql`
    delete from availability_slots
    where supervisor_profile_id = ${profileId}
  `);

  for (const slot of input.slots) {
    await db.execute(sql`
      insert into availability_slots (
        supervisor_profile_id,
        weekday,
        start_time,
        end_time,
        timezone
      ) values (
        ${profileId},
        ${slot.weekday},
        ${slot.startTime},
        ${slot.endTime},
        ${slot.timezone}
      )
    `);
  }

  return listAvailability(db, input.userId);
}

export async function getSuperviseeProfileByUserId(
  db: ProfileDatabase,
  userId: string
): Promise<SuperviseeProfile | null> {
  const result = await db.execute(sql`
    select
      id,
      user_id as "userId",
      display_name as "displayName",
      headline,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from supervisee_profiles
    where user_id = ${userId}
    limit 1
  `);

  return rowsOf<SuperviseeProfile>(result)[0] ?? null;
}

export async function upsertSuperviseeProfile(
  db: ProfileDatabase,
  userId: string,
  input: SuperviseeProfileInput
): Promise<SuperviseeProfile> {
  const result = await db.execute(sql`
    insert into supervisee_profiles (user_id, display_name, headline)
    values (${userId}, ${input.displayName}, ${input.headline})
    on conflict (user_id) do update
    set
      display_name = excluded.display_name,
      headline = excluded.headline,
      updated_at = now()
    returning
      id,
      user_id as "userId",
      display_name as "displayName",
      headline,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `);
  const profile = rowsOf<SuperviseeProfile>(result)[0];

  if (!profile) {
    throw new Error("Failed to upsert supervisee profile");
  }

  return profile;
}

export async function listSpecialtyCatalog(db: ProfileDatabase): Promise<Specialty[]> {
  const result = await db.execute(sql`
    select id, code, label_ko as "labelKo", display_order as "displayOrder", active
    from specialty_catalog
    where active = true
    order by display_order nulls last, code
  `);

  return rowsOf<Specialty>(result);
}

export async function searchSupervisors(
  db: ProfileDatabase,
  input: {
    specialtyCodes: string[];
    qualification: string | null;
    keyword: string | null;
    availability: "this_week" | "this_month" | null;
    priceMin: number | null;
    priceMax: number | null;
    limit: number;
    offset: number;
    sort: "avg_response_minutes" | "average_rating" | "total_completed";
  }
): Promise<PublicSupervisor[]> {
  const conditions: SQL[] = [
    sql`sp.visibility = 'public'`,
    sql`sp.verification_status = 'approved'`
  ];

  if (input.keyword) {
    const keyword = `%${input.keyword}%`;
    conditions.push(sql`
      (
        sp.display_name ilike ${keyword}
        or sp.headline ilike ${keyword}
        or exists (
          select 1
          from supervisor_specialties ss
          join specialty_catalog sc on sc.id = ss.specialty_id
          where ss.supervisor_profile_id = sp.id
            and sc.active = true
            and (sc.label_ko ilike ${keyword} or sc.code ilike ${keyword})
        )
        or exists (
          select 1
          from qualifications q
          where q.supervisor_profile_id = sp.id
            and q.status = 'approved'
            and q.name ilike ${keyword}
        )
      )
    `);
  }
  if (input.specialtyCodes.length > 0) {
    const codes = sql.join(
      input.specialtyCodes.map((code) => sql`${code}`),
      sql`, `
    );
    conditions.push(sql`
      exists (
        select 1
        from supervisor_specialties ss
        join specialty_catalog sc on sc.id = ss.specialty_id
        where ss.supervisor_profile_id = sp.id
          and sc.code in (${codes})
      )
    `);
  }
  if (input.qualification) {
    const qualification = `%${input.qualification}%`;
    conditions.push(sql`
      exists (
        select 1
        from qualifications q
        where q.supervisor_profile_id = sp.id
          and q.status = 'approved'
          and q.name ilike ${qualification}
      )
    `);
  }
  if (input.priceMin !== null || input.priceMax !== null) {
    conditions.push(sql`
      exists (
        select 1
        from service_products p
        where p.supervisor_profile_id = sp.id
          and p.active = true
          and (${input.priceMin}::int is null or p.price_krw >= ${input.priceMin})
          and (${input.priceMax}::int is null or p.price_krw <= ${input.priceMax})
      )
    `);
  }
  if (input.availability !== null) {
    conditions.push(sql`
      exists (
        select 1
        from availability_slots a
        where a.supervisor_profile_id = sp.id
      )
    `);
  }

  const orderBy =
    input.sort === "avg_response_minutes"
      ? sql`sp.avg_response_minutes asc nulls last`
      : input.sort === "total_completed"
        ? sql`sp.total_completed desc nulls last`
        : sql`sp.average_rating desc nulls last`;

  const result = await db.execute(sql`
    select
      sp.id,
      sp.user_id as "userId",
      sp.display_name as "displayName",
      sp.photo_url as "photoUrl",
      sp.headline,
      sp.bio,
      sp.years_of_experience as "yearsOfExperience",
      sp.avg_response_minutes as "avgResponseMinutes",
      sp.total_completed as "totalCompleted",
      sp.average_rating as "averageRating"
    from supervisor_profiles sp
    where ${sql.join(conditions, sql` and `)}
    order by ${orderBy}
    limit ${input.limit}
    offset ${input.offset}
  `);

  return hydratePublicSupervisors(db, rowsOf<PublicSupervisorRow>(result), {
    includeDescription: false
  });
}

export async function getPublicSupervisorDetails(
  db: ProfileDatabase,
  id: string
): Promise<(PublicSupervisor & { qualifications: Array<{ name: string }> }) | null> {
  const result = await db.execute(sql`
    select
      sp.id,
      sp.user_id as "userId",
      sp.display_name as "displayName",
      sp.photo_url as "photoUrl",
      sp.headline,
      sp.bio,
      sp.years_of_experience as "yearsOfExperience",
      sp.avg_response_minutes as "avgResponseMinutes",
      sp.total_completed as "totalCompleted",
      sp.average_rating as "averageRating"
    from supervisor_profiles sp
    where sp.id = ${id}
      and sp.visibility = 'public'
      and sp.verification_status = 'approved'
    limit 1
  `);

  const supervisor = (
    await hydratePublicSupervisors(db, rowsOf<PublicSupervisorRow>(result), {
      includeDescription: true
    })
  )[0];
  if (!supervisor) return null;
  const qualifications = await listPublicQualifications(db, id);
  return { ...supervisor, qualifications };
}

export async function approveQualification(
  db: ProfileDatabase,
  input: { qualificationId: string; reason: string }
): Promise<boolean> {
  const result = await db.execute(sql`
    with updated as (
      update qualifications
      set status = 'approved',
          verification_note = ${input.reason}
      where id = ${input.qualificationId}
        and status = 'pending'
        and exists (
          select 1
          from qualification_evidence_files ef
          where ef.id = qualifications.evidence_file_id
            and ef.supervisor_profile_id = qualifications.supervisor_profile_id
            and ef.virus_scan_status = 'clean'
        )
        and app.is_admin_with_reason()
      returning supervisor_profile_id
    ),
    profile_update as (
      update supervisor_profiles sp
      set verification_status = 'approved',
          verified_at = now(),
          updated_at = now()
      where sp.id in (select supervisor_profile_id from updated)
      returning sp.id
    )
    select
      (select count(*)::int from updated) as count,
      (select count(*)::int from profile_update) as "profileCount"
  `);

  const row = rowsOf<{ count: number; profileCount: number }>(result)[0];
  return row?.count === 1 && row.profileCount === 1;
}

export async function getQualificationReviewReadiness(
  db: ProfileDatabase,
  qualificationId: string
): Promise<QualificationReviewReadiness> {
  const result = await db.execute(sql`
    select
      q.status,
      q.evidence_file_id as "evidenceFileId",
      ef.id as "evidenceId",
      ef.virus_scan_status as "virusScanStatus"
    from qualifications q
    left join qualification_evidence_files ef
      on ef.id = q.evidence_file_id
     and ef.supervisor_profile_id = q.supervisor_profile_id
    where q.id = ${qualificationId}
    limit 1
  `);
  const row =
    rowsOf<{
      status: Qualification["status"];
      evidenceFileId: string | null;
      evidenceId: string | null;
      virusScanStatus: "clean" | "infected" | "error" | null;
    }>(result)[0] ?? null;

  if (!row) return "not_found";
  if (row.status !== "pending") return "invalid_state";
  if (!row.evidenceFileId || !row.evidenceId || row.virusScanStatus !== "clean") {
    return "missing_evidence";
  }
  return "ready";
}

export async function rejectQualification(
  db: ProfileDatabase,
  input: { qualificationId: string; reason: string }
): Promise<boolean> {
  const result = await db.execute(sql`
    update qualifications
    set status = 'rejected',
        verification_note = ${input.reason}
    where id = ${input.qualificationId}
      and app.is_admin_with_reason()
    returning id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

async function hydratePublicSupervisors(
  db: ProfileDatabase,
  supervisors: PublicSupervisorRow[],
  options: { includeDescription: boolean }
): Promise<PublicSupervisor[]> {
  if (supervisors.length === 0) return [];
  const ids = supervisors.map((supervisor) => supervisor.id);
  const products = await listPublicServiceProducts(db, ids, options);
  const specialties = await listPublicSpecialtyCodes(db, ids);
  const productsByProfile = groupBy(products, (product) => product.supervisorProfileId);
  const specialtiesByProfile = groupBy(
    specialties,
    (specialty) => specialty.supervisorProfileId
  );

  return supervisors.map((supervisor) => ({
    ...supervisor,
    serviceProducts: (productsByProfile.get(supervisor.id) ?? []).map((product) => ({
      id: product.id,
      kind: product.kind,
      title: product.title,
      description: product.description ?? null,
      priceKrw: product.priceKrw,
      turnaroundHours: product.turnaroundHours
    })),
    specialties: (specialtiesByProfile.get(supervisor.id) ?? []).map(
      (specialty) => specialty.labelKo
    )
  }));
}

async function listPublicServiceProducts(
  db: ProfileDatabase,
  supervisorProfileIds: string[],
  options: { includeDescription: boolean }
): Promise<PublicServiceProduct[]> {
  const ids = sql.join(
    supervisorProfileIds.map((id) => sql`${id}`),
    sql`, `
  );
  const description = options.includeDescription
    ? sql`p.description as description,`
    : sql`null::text as description,`;
  const result = await db.execute(sql`
    select
      p.supervisor_profile_id as "supervisorProfileId",
      p.id,
      p.kind,
      p.title,
      ${description}
      p.price_krw as "priceKrw",
      p.turnaround_hours as "turnaroundHours"
    from service_products p
    where p.supervisor_profile_id in (${ids})
      and p.active = true
    order by p.price_krw asc
  `);
  return rowsOf<PublicServiceProduct>(result);
}

async function listPublicSpecialtyCodes(
  db: ProfileDatabase,
  supervisorProfileIds: string[]
): Promise<Array<{ supervisorProfileId: string; code: string; labelKo: string }>> {
  const ids = sql.join(
    supervisorProfileIds.map((id) => sql`${id}`),
    sql`, `
  );
  const result = await db.execute(sql`
    select
      ss.supervisor_profile_id as "supervisorProfileId",
      sc.code,
      sc.label_ko as "labelKo"
    from supervisor_specialties ss
    join specialty_catalog sc on sc.id = ss.specialty_id
    where ss.supervisor_profile_id in (${ids})
      and sc.active = true
    order by sc.code
  `);
  return rowsOf<{ supervisorProfileId: string; code: string; labelKo: string }>(result);
}

async function listPublicQualifications(
  db: ProfileDatabase,
  supervisorProfileId: string
): Promise<Array<{ name: string }>> {
  const result = await db.execute(sql`
    select q.name
    from qualifications q
    where q.supervisor_profile_id = ${supervisorProfileId}
      and q.status = 'approved'
    order by q.created_at
  `);
  return rowsOf<{ name: string }>(result);
}

function groupBy<TValue, TKey>(
  values: TValue[],
  getKey: (value: TValue) => TKey
): Map<TKey, TValue[]> {
  const grouped = new Map<TKey, TValue[]>();
  for (const value of values) {
    const key = getKey(value);
    const next = grouped.get(key) ?? [];
    next.push(value);
    grouped.set(key, next);
  }
  return grouped;
}

export async function tryInsertAuditLog(
  db: ProfileDatabase,
  input: {
    actorUserId: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string | null;
    reason: string | null;
  }
): Promise<void> {
  try {
    await db.execute(sql`
      insert into audit_logs (
        actor_user_id,
        actor_role,
        action,
        target_type,
        target_id,
        reason
      ) values (
        ${input.actorUserId},
        ${input.actorRole},
        ${input.action},
        ${input.targetType},
        ${input.targetId},
        ${input.reason}
      )
    `);
  } catch {
    // Best-effort audit for short-reason rejection paths.
  }
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) {
    return result as TRow[];
  }

  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }

  return [];
}
