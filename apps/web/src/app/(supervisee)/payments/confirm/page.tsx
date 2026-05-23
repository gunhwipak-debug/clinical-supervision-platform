import { PaymentConfirmClient } from "./payment-confirm-client";

export const dynamic = "force-dynamic";

export default async function PaymentConfirmPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PaymentConfirmClient
      amount={single(params["amount"])}
      paymentId={single(params["paymentId"])}
      paymentKey={single(params["paymentKey"])}
    />
  );
}

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
