"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../../components/ui/button";
import { Field, Input, Label } from "../../../../components/ui/form";
import { InlineMessage } from "../../auth-ui";

const verifySchema = z.object({
  token: z.string().min(20, "메일 토큰을 입력해주세요.")
});

type VerifyValues = z.infer<typeof verifySchema>;

export function VerifyForm() {
  const [message, setMessage] = useState("");
  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { token: "" }
  });

  async function submit(values: VerifyValues) {
    const response = await fetch("/api/auth/email/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values)
    });
    const body = (await response.json()) as { error?: { code: string } };
    const nextMessage = response.ok
      ? "이메일 인증이 완료되었습니다."
      : (body.error?.code ?? "인증 실패");
    setMessage(nextMessage);
    if (response.ok) {
      toast.success(nextMessage);
    } else {
      toast.error(nextMessage);
    }
  }

  return (
    <section className="grid gap-7">
      <div className="text-center">
        <div className="mx-auto mb-6 grid size-48 place-items-center rounded-full bg-brand-100 text-brand-600">
          <MailCheck aria-hidden size={88} />
        </div>
        <h2 className="text-5xl font-bold leading-tight">이메일 토큰 확인</h2>
        <p className="mt-6 text-2xl leading-relaxed text-ink-700">
          메일에 담긴 인증 토큰을 입력해 계정의 이메일 검증 상태를 완료합니다.
        </p>
      </div>

      <form
        className="grid gap-6 rounded-2xl border border-line bg-surface-elevated p-7 shadow-card"
        onSubmit={form.handleSubmit(submit)}
      >
        <Field className="gap-3">
          <Label className="text-2xl font-bold" htmlFor="token">
            인증 토큰
          </Label>
          <Input
            autoComplete="one-time-code"
            className="h-20 rounded-none bg-surface-base px-6 text-xl"
            id="token"
            placeholder="인증 토큰"
            {...form.register("token")}
          />
          {form.formState.errors.token ? (
            <p className="text-sm text-danger">{form.formState.errors.token.message}</p>
          ) : null}
        </Field>

        <Button
          className="h-20 rounded-lg bg-black text-2xl font-bold text-white hover:bg-ink-900"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          <MailCheck aria-hidden size={26} />
          이메일 인증
        </Button>

        {message ? (
          <InlineMessage tone={message.includes("완료") ? "brand" : "danger"}>
            {message}
          </InlineMessage>
        ) : null}
      </form>
    </section>
  );
}
