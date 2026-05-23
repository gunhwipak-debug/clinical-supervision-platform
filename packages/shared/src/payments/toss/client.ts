import { DevTossClient } from "./dev";
import { TossConfigurationError } from "./errors";
import { ProdTossClient } from "./prod";
import type {
  TossConfirmInput,
  TossConfirmResult,
  TossPaymentIntent,
  TossRefundInput,
  TossRefundResult,
  TossWebhookEvent
} from "./types";

export type TossIntentInput = {
  paymentId: string;
  amount: number;
  orderName: string;
  customerEmail?: string | null;
};

export type TossWebhookParseInput = {
  payload: unknown;
  rawBody: string;
  signature: string | null;
};

export interface TossClient {
  createIntent(input: TossIntentInput): Promise<TossPaymentIntent>;
  confirm(input: TossConfirmInput): Promise<TossConfirmResult>;
  refund(input: TossRefundInput): Promise<TossRefundResult>;
  parseWebhook(input: TossWebhookParseInput): Promise<TossWebhookEvent>;
}

export function getTossClient(env: NodeJS.ProcessEnv = process.env): TossClient {
  if (env["TOSS_MODE"] === "dev") {
    if (env["NODE_ENV"] === "production") {
      throw new TossConfigurationError(
        "TOSS_MODE=dev is not allowed when NODE_ENV=production"
      );
    }
    return new DevTossClient({
      clientKey: env["TOSS_CLIENT_KEY"] ?? "dev-client-key",
      webhookSecret: env["TOSS_WEBHOOK_SECRET"] ?? "dev-webhook-secret"
    });
  }
  if (env["TOSS_MODE"] === "prod") {
    return new ProdTossClient({
      clientKey: env["TOSS_CLIENT_KEY"] ?? "",
      secretKey: env["TOSS_SECRET_KEY"] ?? "",
      webhookSecret: env["TOSS_WEBHOOK_SECRET"] ?? "",
      ...(env["TOSS_API_BASE_URL"] ? { baseUrl: env["TOSS_API_BASE_URL"] } : {})
    });
  }

  throw new TossConfigurationError("TOSS_MODE must be set to dev or prod");
}
