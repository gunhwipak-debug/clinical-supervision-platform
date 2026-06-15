import { PaymentConfirmClient } from "./payment-confirm-client";
import { LoginRequiredState, RoleRequiredState } from "@/components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSupervisee } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function PaymentConfirmPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const current = await getCurrentUser();

  if (!current) {
    return (
      <LoginRequiredState
        title="결제 결과 확인"
        returnTo={`/payments/confirm?${new URLSearchParams(
          compactParams({
            amount: single(params["amount"]),
            paymentId: single(params["paymentId"]),
            paymentKey: single(params["paymentKey"])
          })
        ).toString()}`}
      />
    );
  }
  const currentShellUser = current.user;

  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="결제 결과 확인"
        description="결제 승인은 신청자 작업영역에서만 확인합니다. 관리자 계정은 운영 콘솔에서 결제 상태를 확인해주세요."
        actionHref="/admin"
        actionLabel="운영 콘솔로 이동"
      />
    );
  }

  return (
    <PaymentConfirmClient
      amount={single(params["amount"])}
      paymentId={single(params["paymentId"])}
      paymentKey={single(params["paymentKey"])}
      currentUser={{
        email: currentShellUser.email,
        role: currentShellUser.role
      }}
    />
  );
}

function compactParams(params: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value.length > 0)
  );
}

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
