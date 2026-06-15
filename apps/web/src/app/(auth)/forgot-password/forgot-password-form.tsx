"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Field, Input, Label } from "../../../components/ui/form";
import { InlineMessage } from "../auth-ui";

const forgotPasswordSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요.")
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  async function submit(values: ForgotPasswordValues) {
    const response = await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: values.email.trim().toLowerCase() })
    });
    const body = (await response.json()) as { error?: { code?: string } };

    if (!response.ok || body.error) {
      const next = forgotError(body.error?.code);
      setMessage(next);
      toast.error(next);
      return;
    }

    const next =
      "입력한 이메일로 재설정 안내를 보냈습니다. 계정이 없더라도 같은 안내가 표시됩니다.";
    setMessage(next);
    toast.success("재설정 안내를 보냈습니다.");
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <Field>
        <Label className="text-sm font-semibold text-[#8b94ad]" htmlFor="forgot-email">
          이메일
        </Label>
        <Input
          autoComplete="email"
          className="h-12 rounded-[16px] border-[#e7ebf1] bg-[#f8faff] px-4 text-base shadow-none placeholder:text-[#94a0bc] focus-visible:outline-[#2563ff]"
          id="forgot-email"
          placeholder="이메일 주소"
          type="email"
          {...form.register("email")}
        />
        {form.formState.errors["email"] ? (
          <p className="text-sm text-[#c24141]">
            {form.formState.errors["email"].message}
          </p>
        ) : null}
      </Field>
      <Button
        className="h-12 rounded-[16px] bg-[#2563ff] text-base font-semibold text-white hover:bg-[#1f58e6]"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        <Mail aria-hidden size={18} />
        {form.formState.isSubmitting ? "전송 중" : "재설정 메일 보내기"}
      </Button>
      {message ? <InlineMessage>{message}</InlineMessage> : null}
    </form>
  );
}

function forgotError(code: string | undefined): string {
  const labels: Record<string, string> = {
    invalid_request: "이메일 형식을 확인해주세요."
  };
  return labels[code ?? ""] ?? "재설정 요청을 처리하지 못했습니다.";
}
