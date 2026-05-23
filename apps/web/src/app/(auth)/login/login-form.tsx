"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
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
        body: JSON.stringify(values)
      });
      const body = (await readApiBody(response)) as {
        data?: { user?: { role?: string } };
        error?: { code: string };
      };
      if (response.ok) {
        toast.success("로그인되었습니다.");
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
      description="임상 슈퍼비전 자료와 의뢰 내역을 안전하게 확인합니다."
      title="로그인"
    >
      <form className="grid gap-4" method="post" onSubmit={form.handleSubmit(submit)}>
        <Field className="gap-1.5">
          <Label className="text-sm font-semibold text-ink-900" htmlFor="email">
            이메일
          </Label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              size={20}
            />
            <Input
              autoComplete="email"
              className="h-12 rounded-lg bg-surface-base pl-11 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:h-13 sm:pl-12 sm:text-base"
              id="email"
              placeholder="이메일 주소"
              type="email"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
          ) : null}
        </Field>
        <Field className="gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label
              className="whitespace-nowrap text-sm font-semibold text-ink-900"
              htmlFor="password"
            >
              비밀번호
            </Label>
            <Link
              className="shrink-0 text-right text-xs font-medium text-brand-600 hover:underline sm:text-sm"
              href="/forgot-password"
            >
              비밀번호 찾기
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              size={20}
            />
            <Input
              autoComplete="current-password"
              className="h-12 rounded-lg bg-surface-base px-11 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:h-13 sm:px-12 sm:text-base"
              id="password"
              placeholder="비밀번호를 입력하세요"
              type={showPassword ? "text" : "password"}
              {...form.register("password")}
            />
            <button
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-400 transition hover:bg-surface-sunken hover:text-ink-800"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden size={18} />
              ) : (
                <Eye aria-hidden size={18} />
              )}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="text-xs text-danger">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </Field>
        <Button
          className="mt-2 h-12 rounded-lg bg-ink-900 text-sm font-bold text-surface-elevated transition-colors hover:bg-ink-800 active:bg-ink-950 sm:h-13 sm:text-base"
          disabled={!isHydrated || form.formState.isSubmitting}
          type="submit"
        >
          로그인
          <ArrowRight aria-hidden size={18} />
        </Button>
        <div className="border-t border-line pt-5 text-center text-sm leading-relaxed text-ink-600 sm:text-base">
          아직 계정이 없나요?{" "}
          <Link
            className="font-bold text-ink-900 hover:underline"
            href={
              safeReturnTo(returnTo)
                ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
                : "/signup"
            }
          >
            가입하기
          </Link>
        </div>
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
      : "/supervisors";
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
    email_unverified: "이메일 인증을 먼저 완료해주세요.",
    invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    invalid_request: "입력값을 다시 확인해주세요.",
    rate_limited: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    server_unavailable:
      "서버 설정 또는 데이터베이스 연결 문제로 로그인할 수 없습니다. 관리자에게 문의해주세요.",
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
