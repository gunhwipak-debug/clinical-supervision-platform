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
  mailCode: z.string().min(20, "메일 확인 정보를 입력해주세요.")
});

type VerifyValues = z.infer<typeof verifySchema>;

export function VerifyForm() {
  const [message, setMessage] = useState("");
  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { mailCode: "" }
  });

  async function submit(values: VerifyValues) {
    const response = await fetch("/api/auth/email/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: values.mailCode })
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
    <section className="grid gap-5">
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-[18px] bg-[#f5f8ff] text-[#2563ff]">
          <MailCheck aria-hidden size={26} />
        </div>
        <h2 className="text-xl font-bold leading-tight text-[#081225]">이메일 확인</h2>
        <p className="mt-2 text-sm leading-7 text-[#5f6c8f]">
          메일에 담긴 확인 정보를 입력하면 계정을 사용할 수 있습니다.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
        <Field>
          <Label className="text-sm font-semibold text-[#8b94ad]" htmlFor="mail-code">
            메일 확인 정보
          </Label>
          <Input
            autoComplete="one-time-code"
            className="h-12 rounded-[16px] border-[#e7ebf1] bg-[#f8faff] px-4 text-base shadow-none placeholder:text-[#94a0bc] focus-visible:outline-[#2563ff]"
            id="mail-code"
            placeholder="메일 확인 정보"
            {...form.register("mailCode")}
          />
          {form.formState.errors.mailCode ? (
            <p className="text-sm text-[#c24141]">
              {form.formState.errors.mailCode.message}
            </p>
          ) : null}
        </Field>

        <Button
          className="h-12 rounded-[16px] bg-[#2563ff] text-base font-semibold text-white hover:bg-[#1f58e6]"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          <MailCheck aria-hidden size={18} />
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
