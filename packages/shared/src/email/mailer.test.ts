import { describe, expect, it, vi } from "vitest";
import {
  DevConsoleMailer,
  getMailer,
  MailerConfigurationError,
  ResendMailer,
  ResendStubMailer,
  SmtpDryRunMailer
} from "./mailer";

describe("mailer factory", () => {
  it("defaults to the dev console mailer", () => {
    expect(getMailer({})).toBeInstanceOf(DevConsoleMailer);
  });

  it("creates a Resend stub mailer when configured", async () => {
    const logs: string[] = [];
    const mailer = getMailer(
      { MAILER_MODE: "resend_stub", MAIL_FROM: "no-reply@example.com" },
      { log: (message) => logs.push(message) }
    );

    expect(mailer).toBeInstanceOf(ResendStubMailer);
    await mailer.send({
      to: "user@example.com",
      subject: "Verify",
      text: "token"
    });
    expect(logs[0]).toContain("[resend-stub-mailer]");
  });

  it("validates SMTP dry-run configuration", () => {
    expect(() => getMailer({ MAILER_MODE: "smtp_dry_run" })).toThrow(
      MailerConfigurationError
    );
  });

  it("validates Resend configuration", () => {
    expect(() => getMailer({ MAILER_MODE: "resend" })).toThrow(
      MailerConfigurationError
    );
  });

  it("sends through Resend with plain text and idempotency header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email-id" }), {
        headers: { "content-type": "application/json" },
        status: 200
      })
    );
    const mailer = new ResendMailer({
      apiKey: "re_test",
      baseUrl: "https://api.test.resend.com",
      fetch: fetchMock,
      from: "ClinicFlow <no-reply@example.com>"
    });

    await mailer.send({
      idempotencyKey: "session-reminder/request-1",
      metadata: { kind: "session_reminder" },
      subject: "일정 알림",
      text: "환자 정보 없는 일정 알림입니다.",
      to: "user@example.com"
    });

    const call = fetchMock.mock.calls[0];
    const init = call?.[1] as RequestInit & { headers: Record<string, string> };

    expect(call?.[0]).toBe("https://api.test.resend.com/emails");
    expect(init.body).toBe(
      JSON.stringify({
        from: "ClinicFlow <no-reply@example.com>",
        subject: "일정 알림",
        text: "환자 정보 없는 일정 알림입니다.",
        to: ["user@example.com"]
      })
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      authorization: "Bearer re_test",
      "content-type": "application/json",
      "idempotency-key": "session-reminder/request-1",
      "user-agent": "ClinicFlow/0.1.0"
    });
  });

  it("fails loudly when Resend rejects delivery", async () => {
    const mailer = new ResendMailer({
      apiKey: "re_test",
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "domain not verified" }), {
          headers: { "content-type": "application/json" },
          status: 403
        })
      ),
      from: "no-reply@example.com"
    });

    await expect(
      mailer.send({
        subject: "Verify",
        text: "token",
        to: "user@example.com"
      })
    ).rejects.toThrow("domain not verified");
  });

  it("creates an SMTP dry-run mailer with complete configuration", () => {
    expect(
      getMailer({
        MAILER_MODE: "smtp_dry_run",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_USER: "user",
        SMTP_PASSWORD: "password",
        MAIL_FROM: "no-reply@example.com"
      })
    ).toBeInstanceOf(SmtpDryRunMailer);
  });

  it("warns that SMTP dry-run does not send real email", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mailer = getMailer({
      MAILER_MODE: "smtp_dry_run",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "user",
      SMTP_PASSWORD: "password",
      MAIL_FROM: "no-reply@example.com"
    });

    await mailer.send({
      to: "user@example.com",
      subject: "Dry run",
      text: "no real delivery"
    });

    expect(warn).toHaveBeenCalledWith("[smtp-dry-run] no real send, EPIC 11에서 회수");
    warn.mockRestore();
  });

  it("accepts deprecated smtp mode with an explicit warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(
      getMailer({
        MAILER_MODE: "smtp",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_USER: "user",
        SMTP_PASSWORD: "password",
        MAIL_FROM: "no-reply@example.com"
      })
    ).toBeInstanceOf(SmtpDryRunMailer);
    expect(warn).toHaveBeenCalledWith(
      "[mailer] MAILER_MODE=smtp is deprecated; use smtp_dry_run until EPIC 11 real delivery"
    );
    warn.mockRestore();
  });
});
