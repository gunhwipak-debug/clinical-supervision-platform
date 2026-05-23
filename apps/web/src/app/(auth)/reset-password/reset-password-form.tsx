"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Field, Input, Label } from "../../../components/ui/form";
import { InlineMessage } from "../auth-ui";

const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
    password: z
      .string()
      .min(10, "비밀번호는 10자 이상이어야 합니다.")
      .max(256)
      .regex(/\d/u, "숫자를 포함해야 합니다.")
      .regex(/[^A-Za-z0-9]/u, "특수문자를 포함해야 합니다."),
    token: z.string().min(20, "메일의 재설정 토큰을 입력해주세요.").max(256)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "비밀번호가 서로 다릅니다.",
    path: ["confirmPassword"]
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ initialToken }: { initialToken: string }) {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      confirmPassword: "",
      password: "",
      token: initialToken
    }
  });

  async function submit(values: ResetPasswordValues) {
    const response = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: values.password, token: values.token })
    });
    const body = (await response.json()) as { error?: { code?: string } };

    if (!response.ok || body.error) {
      const next = resetError(body.error?.code);
      setMessage(next);
      toast.error(next);
      return;
    }

    const next = "비밀번호를 변경했습니다. 새 비밀번호로 로그인해주세요.";
    setDone(true);
    setMessage(next);
    toast.success(next);
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <Field>
        <Label htmlFor="reset-token">재설정 토큰</Label>
        <Input
          autoComplete="one-time-code"
          id="reset-token"
          placeholder="메일의 토큰"
          {...form.register("token")}
        />
        {form.formState.errors.token ? (
          <p className="text-sm text-danger">{form.formState.errors.token.message}</p>
        ) : null}
      </Field>
      <Field>
        <Label htmlFor="reset-password">새 비밀번호</Label>
        <Input
          autoComplete="new-password"
          id="reset-password"
          type="password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-danger">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </Field>
      <Field>
        <Label htmlFor="reset-confirm-password">새 비밀번호 확인</Label>
        <Input
          autoComplete="new-password"
          id="reset-confirm-password"
          type="password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-sm text-danger">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </Field>
      <Button disabled={form.formState.isSubmitting || done} type="submit">
        <KeyRound aria-hidden size={18} />
        {form.formState.isSubmitting ? "변경 중" : "비밀번호 변경"}
      </Button>
      {message ? (
        <InlineMessage tone={done ? "brand" : "danger"}>{message}</InlineMessage>
      ) : null}
      {done ? (
        <Button asChild variant="secondary">
          <Link href="/login">로그인하기</Link>
        </Button>
      ) : null}
    </form>
  );
}

function resetError(code: string | undefined): string {
  const labels: Record<string, string> = {
    invalid_request: "입력값을 확인해주세요.",
    invalid_token: "재설정 토큰이 만료되었거나 이미 사용되었습니다."
  };
  return labels[code ?? ""] ?? "비밀번호를 변경하지 못했습니다.";
}
