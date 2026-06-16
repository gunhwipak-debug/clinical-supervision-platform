"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Field, Input, Label } from "../../../components/ui/form";
import { AuthPanel, InlineMessage } from "../auth-ui";

const loginSchema = z.object({
  email: z.email("이메일 형식으로 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요.")
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ returnTo = "" }: { returnTo?: string }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function submit(values: LoginValues) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, returnTo })
      });
      const body = (await readApiBody(response)) as {
        data?: { adminHandoffUrl?: string; user?: { role?: string } };
        error?: { code: string };
      };
      if (response.ok) {
        toast.success("로그인되었습니다.");
        if (body.data?.adminHandoffUrl) {
          window.location.href = body.data.adminHandoffUrl;
          return;
        }
        const role = body.data?.user?.role;
        window.location.href = safeReturnTo(returnTo) ?? roleHome(role);
        return;
      }
      const next = loginErrorMessage(body.error?.code);
      setMessage(next);
      toast.error(next);
    } catch {
      const next = loginErrorMessage("server_unavailable");
      setMessage(next);
      toast.error(next);
    }
  }

  return (
    <AuthPanel
      description="의뢰 자료와 슈퍼비전 기록을 안전하게 확인합니다."
      title="로그인"
    >
      <form className="grid gap-4" method="post" onSubmit={form.handleSubmit(submit)}>
        <Field className="gap-2">
          <Label className="text-sm font-semibold text-[#8b94ad]" htmlFor="email">
            이메일
          </Label>
          <Input
            autoComplete="email"
            className="h-12 rounded-[16px] border-[#e7ebf1] bg-[#f8faff] px-4 text-base shadow-none placeholder:text-[#94a0bc] focus-visible:outline-[#2563ff]"
            id="email"
            placeholder="이메일 주소"
            type="email"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-[#c24141]">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </Field>
        <Field className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label
              className="whitespace-nowrap text-sm font-semibold text-[#8b94ad]"
              htmlFor="password"
            >
              비밀번호
            </Label>
            <Link
              className="text-sm font-semibold text-[#2563ff] hover:underline"
              href="/forgot-password"
            >
              비밀번호 찾기
            </Link>
          </div>
          <div className="relative">
            <Input
              autoComplete="current-password"
              className="h-12 rounded-[16px] border-[#e7ebf1] bg-[#f8faff] px-4 pr-12 text-base shadow-none placeholder:text-[#94a0bc] focus-visible:outline-[#2563ff]"
              id="password"
              placeholder="비밀번호를 입력하세요"
              type={showPassword ? "text" : "password"}
              {...form.register("password")}
            />
            <button
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5f6c8f] hover:text-[#081225]"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="text-sm text-[#c24141]">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </Field>
        <Button
          className="mt-2 h-12 rounded-[16px] bg-[#2563ff] text-base font-semibold text-white hover:bg-[#1f58e6]"
          disabled={!isHydrated || form.formState.isSubmitting}
          type="submit"
        >
          로그인
        </Button>
        <p className="text-center text-sm leading-7 text-[#5f6c8f]">
          처음이라면{" "}
          <Link
            className="font-semibold text-[#2563ff] hover:underline"
            href={
              safeReturnTo(returnTo)
                ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
                : "/signup"
            }
          >
            계정 만들기
          </Link>
          에서 시작할 수 있습니다.
        </p>
        {message ? (
          <div role="alert">
            <InlineMessage tone="danger">{message}</InlineMessage>
          </div>
        ) : null}
      </form>
    </AuthPanel>
  );
}

function roleHome(role: string | undefined): string {
  return role === "supervisor"
    ? "/supervisor"
    : role === "admin"
      ? "/admin"
      : "/requests";
}

function safeReturnTo(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/signup")) return null;
  return value;
}

function loginErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    account_locked:
      "로그인 시도가 여러 번 실패해 계정이 잠시 잠겼습니다. 잠시 후 다시 시도해주세요.",
    email_unverified: "이메일 인증을 완료해주세요.",
    invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    invalid_request: "입력값을 다시 확인해주세요.",
    locked:
      "로그인 시도가 여러 번 실패해 계정이 잠시 잠겼습니다. 잠시 후 다시 시도해주세요.",
    rate_limited: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    server_unavailable:
      "일시적인 문제로 로그인할 수 없습니다. 잠시 후 다시 시도하거나 관리자에게 문의해주세요.",
    totp_required: "2단계 인증이 필요합니다.",
    unauthorized: "이메일 또는 비밀번호가 올바르지 않습니다."
  };
  return labels[code ?? ""] ?? "로그인에 실패했습니다. 입력값을 다시 확인해주세요.";
}

async function readApiBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
