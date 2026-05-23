export type MailPayload = {
  idempotencyKey?: string;
  to: string;
  subject: string;
  text: string;
  metadata?: Record<string, string>;
};

export type MailerMode = "dev" | "resend" | "smtp_dry_run" | "resend_stub";

export type MailerEnv = {
  [key: string]: string | undefined;
};

export type Mailer = {
  send: (payload: MailPayload) => Promise<void>;
};

export class MailerConfigurationError extends Error {
  readonly code = "mailer_configuration_error";

  constructor(message: string) {
    super(message);
    this.name = "MailerConfigurationError";
  }
}

export class DevConsoleMailer implements Mailer {
  send(payload: MailPayload): Promise<void> {
    console.info("[dev-mailer]", JSON.stringify(payload));
    return Promise.resolve();
  }
}

export class ResendStubMailer implements Mailer {
  constructor(
    private readonly config: {
      from: string;
      log?: (message: string) => void;
    }
  ) {
    if (!config.from) {
      throw new MailerConfigurationError(
        "MAIL_FROM is required for MAILER_MODE=resend_stub"
      );
    }
  }

  send(payload: MailPayload): Promise<void> {
    this.config.log?.(
      `[resend-stub-mailer] ${JSON.stringify({ from: this.config.from, ...payload })}`
    );
    return Promise.resolve();
  }
}

export class ResendMailer implements Mailer {
  private readonly endpoint: string;

  constructor(
    private readonly config: {
      apiKey: string;
      fetch?: typeof fetch;
      from: string;
      userAgent?: string;
      baseUrl?: string;
    }
  ) {
    const missing = [
      ["RESEND_API_KEY", config.apiKey],
      ["MAIL_FROM", config.from]
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new MailerConfigurationError(
        `${missing.join(", ")} required for MAILER_MODE=resend`
      );
    }

    this.endpoint = `${(config.baseUrl ?? "https://api.resend.com").replace(
      /\/$/u,
      ""
    )}/emails`;
  }

  async send(payload: MailPayload): Promise<void> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${this.config.apiKey}`,
      "content-type": "application/json",
      "user-agent": this.config.userAgent ?? "ClinicFlow/0.1.0"
    };
    if (payload.idempotencyKey) {
      headers["idempotency-key"] = payload.idempotencyKey.slice(0, 256);
    }

    const response = await (this.config.fetch ?? fetch)(this.endpoint, {
      body: JSON.stringify({
        from: this.config.from,
        subject: payload.subject,
        text: payload.text,
        to: [payload.to]
      }),
      headers,
      method: "POST"
    });

    if (!response.ok) {
      throw new MailerConfigurationError(
        `Resend delivery failed: ${await readResendError(response)}`
      );
    }
  }
}

export class SmtpDryRunMailer implements Mailer {
  constructor(
    private readonly config: {
      host: string;
      port: string;
      user: string;
      password: string;
      from: string;
      log?: (message: string) => void;
    }
  ) {
    const missing = [
      ["SMTP_HOST", config.host],
      ["SMTP_PORT", config.port],
      ["SMTP_USER", config.user],
      ["SMTP_PASSWORD", config.password],
      ["MAIL_FROM", config.from]
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new MailerConfigurationError(
        `${missing.join(", ")} required for MAILER_MODE=smtp_dry_run`
      );
    }
  }

  send(payload: MailPayload): Promise<void> {
    console.warn("[smtp-dry-run] no real send, EPIC 11에서 회수");
    this.config.log?.(
      `[smtp-dry-run-mailer] ${JSON.stringify({
        host: this.config.host,
        port: this.config.port,
        from: this.config.from,
        to: payload.to,
        subject: payload.subject,
        metadata: payload.metadata ?? {}
      })}`
    );
    return Promise.resolve();
  }
}

export function getMailer(
  env: MailerEnv = process.env,
  options: { log?: (message: string) => void } = {}
): Mailer {
  const mode = parseMailerMode(env["MAILER_MODE"]);
  if (mode === "dev") return new DevConsoleMailer();
  if (mode === "resend") {
    return new ResendMailer({
      apiKey: env["RESEND_API_KEY"] ?? "",
      from: env["MAIL_FROM"] ?? "",
      ...(env["RESEND_API_BASE_URL"] ? { baseUrl: env["RESEND_API_BASE_URL"] } : {})
    });
  }
  if (mode === "resend_stub") {
    return new ResendStubMailer({
      from: env["MAIL_FROM"] ?? "",
      log: options.log ?? console.info
    });
  }
  return new SmtpDryRunMailer({
    host: env["SMTP_HOST"] ?? "",
    port: env["SMTP_PORT"] ?? "",
    user: env["SMTP_USER"] ?? "",
    password: env["SMTP_PASSWORD"] ?? "",
    from: env["MAIL_FROM"] ?? "",
    log: options.log ?? console.info
  });
}

function parseMailerMode(value: string | undefined): MailerMode {
  if (!value || value === "dev") return "dev";
  if (value === "resend" || value === "smtp_dry_run" || value === "resend_stub") {
    return value;
  }
  if (value === "smtp") {
    console.warn(
      "[mailer] MAILER_MODE=smtp is deprecated; use smtp_dry_run until EPIC 11 real delivery"
    );
    return "smtp_dry_run";
  }
  throw new MailerConfigurationError(`Unsupported MAILER_MODE: ${value}`);
}

async function readResendError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return (
      body.message ?? body.error ?? `${String(response.status)} ${response.statusText}`
    );
  } catch {
    return `${String(response.status)} ${response.statusText}`;
  }
}
