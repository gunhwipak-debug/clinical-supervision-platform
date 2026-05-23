import type { SupervisionStatus } from "@csp/shared/supervision/status-machine";
import { sql, type SQL } from "drizzle-orm";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded"
  | "cancelled";

export type RefundStatus = "requested" | "approved" | "rejected" | "completed";
export type PayoutStatus = "scheduled" | "held" | "paid" | "failed";

export type PaymentRecord = {
  id: string;
  supervisionRequestId: string;
  superviseeId: string;
  supervisorId: string | null;
  amountKrw: number;
  platformFeeKrw: number;
  supervisorNetKrw: number;
  pgProvider: string;
  pgPaymentKey: string | null;
  pgOrderId: string;
  status: PaymentStatus;
  paidAt: Date | string | null;
  createdAt: Date | string;
  requestStatus: SupervisionStatus;
  productTitle: string | null;
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  amountKrw: number;
  reason: string | null;
  initiatedBy: string | null;
  status: RefundStatus;
  completedAt: Date | string | null;
  createdAt: Date | string;
  paymentStatus: PaymentStatus;
  paymentKey: string | null;
  paymentAmountKrw: number;
  supervisionRequestId: string;
  requestStatus: SupervisionStatus;
};

export type PayoutRecord = {
  id: string;
  supervisorId: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  grossKrw: number;
  platformFeeKrw: number;
  netKrw: number;
  status: PayoutStatus;
  scheduledAt: Date | string | null;
  paidAt: Date | string | null;
};

type PaymentDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function getIntentSource(
  db: PaymentDatabase,
  requestId: string
): Promise<{
  requestId: string;
  superviseeId: string;
  status: SupervisionStatus;
  priceKrw: number;
  productTitle: string;
} | null> {
  const result = await db.execute(sql`
    select
      sr.id as "requestId",
      sr.supervisee_id as "superviseeId",
      sr.status,
      p.price_krw as "priceKrw",
      p.title as "productTitle"
    from supervision_requests sr
    join service_products p on p.id = sr.service_product_id
    where sr.id = ${requestId}
    limit 1
  `);

  return (
    rowsOf<{
      requestId: string;
      superviseeId: string;
      status: SupervisionStatus;
      priceKrw: number;
      productTitle: string;
    }>(result)[0] ?? null
  );
}

export async function createPendingPayment(
  db: PaymentDatabase,
  input: {
    id: string;
    supervisionRequestId: string;
    amountKrw: number;
    platformFeeKrw: number;
    supervisorNetKrw: number;
    pgOrderId: string;
  }
): Promise<PaymentRecord | null> {
  const result = await db.execute(sql`
    insert into payments (
      id,
      supervision_request_id,
      amount_krw,
      platform_fee_krw,
      supervisor_net_krw,
      pg_order_id,
      status
    ) values (
      ${input.id},
      ${input.supervisionRequestId},
      ${input.amountKrw},
      ${input.platformFeeKrw},
      ${input.supervisorNetKrw},
      ${input.pgOrderId},
      'pending'
    )
    returning
      id,
      supervision_request_id as "supervisionRequestId",
      null::uuid as "superviseeId",
      null::uuid as "supervisorId",
      amount_krw as "amountKrw",
      platform_fee_krw as "platformFeeKrw",
      supervisor_net_krw as "supervisorNetKrw",
      pg_provider as "pgProvider",
      pg_payment_key as "pgPaymentKey",
      pg_order_id as "pgOrderId",
      status,
      paid_at as "paidAt",
      created_at as "createdAt",
      'awaiting_payment'::text as "requestStatus",
      null::text as "productTitle"
  `);

  return rowsOf<PaymentRecord>(result)[0] ?? null;
}

export async function getPendingPaymentForRequest(
  db: PaymentDatabase,
  requestId: string
): Promise<PaymentRecord | null> {
  const result = await db.execute(
    paymentSelect(
      sql`pay.supervision_request_id = ${requestId} and pay.status = 'pending'`,
      sql`pay.created_at desc`
    )
  );
  return rowsOf<PaymentRecord>(result)[0] ?? null;
}

export async function getPaymentById(
  db: PaymentDatabase,
  paymentId: string
): Promise<PaymentRecord | null> {
  const result = await db.execute(paymentSelect(sql`pay.id = ${paymentId}`));
  return rowsOf<PaymentRecord>(result)[0] ?? null;
}

export async function getPaymentByOrderId(
  db: PaymentDatabase,
  orderId: string
): Promise<PaymentRecord | null> {
  const result = await db.execute(paymentSelect(sql`pay.pg_order_id = ${orderId}`));
  return rowsOf<PaymentRecord>(result)[0] ?? null;
}

export async function listPayments(db: PaymentDatabase): Promise<PaymentRecord[]> {
  const result = await db.execute(paymentSelect(sql`true`, sql`pay.created_at desc`));
  return rowsOf<PaymentRecord>(result);
}

export async function markPaymentPaid(
  db: PaymentDatabase,
  input: { paymentId: string; paymentKey: string }
): Promise<PaymentRecord | null> {
  const result = await db.execute(sql`
    update payments
    set status = 'paid',
        paid_at = coalesce(paid_at, now()),
        pg_payment_key = coalesce(pg_payment_key, ${input.paymentKey})
    where id = ${input.paymentId}
      and status = 'pending'
      and (pg_payment_key is null or pg_payment_key = ${input.paymentKey})
    returning id
  `);
  const updated = rowsOf<{ id: string }>(result)[0];
  if (!updated) return null;
  return getPaymentById(db, input.paymentId);
}

export async function cancelPendingPaymentsForRequest(
  db: PaymentDatabase,
  requestId: string
): Promise<number> {
  const result = await db.execute(sql`
    update payments
    set status = 'cancelled'
    where supervision_request_id = ${requestId}
      and status = 'pending'
    returning id
  `);
  return rowsOf<{ id: string }>(result).length;
}

export async function createRefundRequest(
  db: PaymentDatabase,
  input: {
    paymentId: string;
    amountKrw: number;
    reason: string;
    initiatedBy: string;
  }
): Promise<RefundRecord | null> {
  const result = await db.execute(sql`
    with paid as (
      select
        p.id,
        p.amount_krw,
        coalesce(sum(r.amount_krw) filter (where r.status in ('requested', 'completed')), 0)::int as existing_refunds
      from payments p
      left join refunds r on r.payment_id = p.id
      where p.id = ${input.paymentId}
        and p.status in ('paid', 'partially_refunded')
      group by p.id
    )
    insert into refunds (
      payment_id,
      amount_krw,
      reason,
      initiated_by,
      status
    )
    select
      paid.id,
      ${input.amountKrw},
      ${input.reason},
      ${input.initiatedBy},
      'requested'
    from paid
    where paid.existing_refunds + ${input.amountKrw} <= paid.amount_krw
    returning id
  `);
  const refund = rowsOf<{ id: string }>(result)[0];
  if (!refund) return null;
  return getRefundById(db, refund.id);
}

export async function getRefundById(
  db: PaymentDatabase,
  refundId: string
): Promise<RefundRecord | null> {
  const result = await db.execute(refundSelect(sql`r.id = ${refundId}`));
  return rowsOf<RefundRecord>(result)[0] ?? null;
}

export async function listRefundRequests(
  db: PaymentDatabase,
  status: RefundStatus | null = null
): Promise<RefundRecord[]> {
  const condition = status ? sql`r.status = ${status}` : sql`true`;
  const result = await db.execute(refundSelect(condition, sql`r.created_at desc`));
  return rowsOf<RefundRecord>(result);
}

export async function completeRefund(
  db: PaymentDatabase,
  refundId: string
): Promise<RefundRecord | null> {
  const result = await db.execute(sql`
    with target as (
      select
        r.id,
        r.payment_id,
        r.amount_krw,
        p.amount_krw as payment_amount,
        coalesce(sum(existing.amount_krw) filter (where existing.status = 'completed'), 0)::int as completed_refunds
      from refunds r
      join payments p on p.id = r.payment_id
      left join refunds existing on existing.payment_id = p.id
      where r.id = ${refundId}
        and r.status = 'requested'
      group by r.id, p.amount_krw
    ),
    completed as (
      update refunds r
      set status = 'completed',
          completed_at = now()
      from target
      where r.id = target.id
      returning r.payment_id
    ),
    totals as (
      select
        target.payment_id,
        target.payment_amount as amount_krw,
        (target.completed_refunds + target.amount_krw)::int as refunded
      from target
      join completed c on c.payment_id = target.payment_id
    )
    update payments p
    set status = case
      when totals.refunded >= totals.amount_krw then 'refunded'::payment_status
      else 'partially_refunded'::payment_status
    end
    from totals
    where p.id = totals.payment_id
    returning p.id
  `);
  const updated = rowsOf<{ id: string }>(result)[0];
  if (!updated) return null;
  return getRefundById(db, refundId);
}

export async function rejectRefund(
  db: PaymentDatabase,
  refundId: string,
  reason: string
): Promise<RefundRecord | null> {
  const result = await db.execute(sql`
    update refunds
    set status = 'rejected',
        reason = coalesce(reason, '') || E'\nRejected: ' || ${reason}
    where id = ${refundId}
      and status = 'requested'
    returning id
  `);
  const updated = rowsOf<{ id: string }>(result)[0];
  if (!updated) return null;
  return getRefundById(db, refundId);
}

export async function computePayouts(
  db: PaymentDatabase,
  input: { periodStart: string; periodEnd: string }
): Promise<PayoutRecord[]> {
  const result = await db.execute(sql`
    with payment_base as (
      select
        sr.supervisor_id,
        p.id as payment_id,
        p.amount_krw,
        p.platform_fee_krw,
        p.supervisor_net_krw,
        coalesce(sum(r.amount_krw) filter (where r.status = 'completed'), 0)::int as refunded_krw
      from payments p
      join supervision_requests sr on sr.id = p.supervision_request_id
      left join refunds r on r.payment_id = p.id
      where p.status in ('paid', 'partially_refunded')
        and p.paid_at >= ${input.periodStart}::date
        and p.paid_at < (${input.periodEnd}::date + interval '1 day')
        and sr.supervisor_id is not null
        and sr.status in ('completion_record_issued', 'completed')
        and not exists (
          select 1
          from refunds pending_refund
          where pending_refund.payment_id = p.id
            and pending_refund.status = 'requested'
        )
      group by sr.supervisor_id, p.id
    ),
    totals as (
      select
        supervisor_id,
        sum(amount_krw)::int as gross_krw,
        sum(platform_fee_krw)::int as platform_fee_krw,
        greatest(sum(supervisor_net_krw - refunded_krw), 0)::int as net_krw
      from payment_base
      group by supervisor_id
    ),
    upserted as (
      insert into payouts (
        supervisor_id,
        period_start,
        period_end,
        gross_krw,
        platform_fee_krw,
        net_krw,
        status,
        scheduled_at
      )
      select
        supervisor_id,
        ${input.periodStart},
        ${input.periodEnd},
        gross_krw,
        platform_fee_krw,
        net_krw,
        'scheduled',
        current_date
      from totals
      on conflict (supervisor_id, period_start, period_end) do update
      set gross_krw = case
            when payouts.status in ('paid', 'held') then payouts.gross_krw
            else excluded.gross_krw
          end,
          platform_fee_krw = case
            when payouts.status in ('paid', 'held') then payouts.platform_fee_krw
            else excluded.platform_fee_krw
          end,
          net_krw = case
            when payouts.status in ('paid', 'held') then payouts.net_krw
            else excluded.net_krw
          end,
          status = case
            when payouts.status in ('paid', 'held') then payouts.status
            else 'scheduled'::payout_status
          end,
          scheduled_at = case
            when payouts.status in ('paid', 'held') then payouts.scheduled_at
            else current_date
          end
      returning *
    )
    select
      id,
      supervisor_id as "supervisorId",
      period_start as "periodStart",
      period_end as "periodEnd",
      gross_krw as "grossKrw",
      platform_fee_krw as "platformFeeKrw",
      net_krw as "netKrw",
      status,
      scheduled_at as "scheduledAt",
      paid_at as "paidAt"
    from upserted
    order by supervisor_id
  `);

  return rowsOf<PayoutRecord>(result);
}

export async function listPayouts(
  db: PaymentDatabase,
  supervisorId: string | null = null
): Promise<PayoutRecord[]> {
  const condition = supervisorId ? sql`supervisor_id = ${supervisorId}` : sql`true`;
  const result = await db.execute(sql`
    select
      id,
      supervisor_id as "supervisorId",
      period_start as "periodStart",
      period_end as "periodEnd",
      gross_krw as "grossKrw",
      platform_fee_krw as "platformFeeKrw",
      net_krw as "netKrw",
      status,
      scheduled_at as "scheduledAt",
      paid_at as "paidAt"
    from payouts
    where ${condition}
    order by period_start desc, supervisor_id
  `);

  return rowsOf<PayoutRecord>(result);
}

function paymentSelect(condition: SQL, orderBy: SQL = sql`pay.created_at desc`): SQL {
  return sql`
    select
      pay.id,
      pay.supervision_request_id as "supervisionRequestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      pay.amount_krw as "amountKrw",
      pay.platform_fee_krw as "platformFeeKrw",
      pay.supervisor_net_krw as "supervisorNetKrw",
      pay.pg_provider as "pgProvider",
      pay.pg_payment_key as "pgPaymentKey",
      pay.pg_order_id as "pgOrderId",
      pay.status,
      pay.paid_at as "paidAt",
      pay.created_at as "createdAt",
      sr.status as "requestStatus",
      sp.title as "productTitle"
    from payments pay
    join supervision_requests sr on sr.id = pay.supervision_request_id
    left join service_products sp on sp.id = sr.service_product_id
    where ${condition}
    order by ${orderBy}
  `;
}

function refundSelect(condition: SQL, orderBy: SQL = sql`r.created_at desc`): SQL {
  return sql`
    select
      r.id,
      r.payment_id as "paymentId",
      r.amount_krw as "amountKrw",
      r.reason,
      r.initiated_by as "initiatedBy",
      r.status,
      r.completed_at as "completedAt",
      r.created_at as "createdAt",
      p.status as "paymentStatus",
      p.pg_payment_key as "paymentKey",
      p.amount_krw as "paymentAmountKrw",
      p.supervision_request_id as "supervisionRequestId",
      sr.status as "requestStatus"
    from refunds r
    join payments p on p.id = r.payment_id
    join supervision_requests sr on sr.id = p.supervision_request_id
    where ${condition}
    order by ${orderBy}
  `;
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
