"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Field, Input, Label } from "../../../components/ui/form";
import { InlineMessage } from "../auth-ui";

const signupSchema = z.object({
  email: z.email("이메일 형식으로 입력해주세요."),
  password: z
    .string()
    .min(10, "비밀번호는 10자 이상이어야 합니다.")
    .regex(/[0-9]/, "숫자를 1개 이상 포함해주세요.")
    .regex(/[^A-Za-z0-9]/, "특수문자를 1개 이상 포함해주세요."),
  tos: z.boolean().refine(Boolean, { message: "이용약관 동의가 필요합니다." }),
  privacy: z
    .boolean()
    .refine(Boolean, { message: "개인정보 처리방침 동의가 필요합니다." }),
  sensitive: z
    .boolean()
    .refine(Boolean, { message: "민감정보 처리 동의가 필요합니다." })
});

type SignupValues = z.infer<typeof signupSchema>;

const consentItems = [
  ["tos", "서비스 이용약관", "/terms"],
  ["privacy", "개인정보 처리방침", "/privacy"],
  ["sensitive", "민감정보 처리 동의", "/sensitive-consent"]
] as const;

export function SignupForm() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      tos: false,
      privacy: false,
      sensitive: false
    }
  });
  const consentValues = form.watch(["tos", "privacy", "sensitive"]);
  const allRequiredConsents = consentValues.every(Boolean);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function submit(values: SignupValues) {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        consent: {
          tos: values.tos,
          privacy: values.privacy,
          sensitive: values.sensitive
        }
      })
    });
    const body = (await response.json()) as { error?: { code: string } };
    const nextMessage = response.ok
      ? "가입 요청이 완료되었습니다. 이메일 인증을 진행해주세요."
      : signupErrorMessage(body.error?.code);
    setMessage(nextMessage);
    if (response.ok) {
      toast.success("가입 요청 완료");
    } else {
      toast.error(nextMessage);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[580px] gap-7">
      <div>
        <h2 className="text-4xl font-bold leading-tight text-ink-900">계정 만들기</h2>
        <p className="mt-3 text-xl leading-relaxed text-ink-700">
          가입 후 필요한 경우 슈퍼바이저 신청을 진행할 수 있습니다.
        </p>
      </div>

      <form className="grid gap-7" method="post" onSubmit={form.handleSubmit(submit)}>
        <fieldset className="grid gap-5 rounded-2xl border border-line bg-surface-elevated p-6 shadow-card">
          <legend className="sr-only">계정 정보</legend>
          <Field className="gap-2">
            <Label className="text-lg font-medium" htmlFor="email">
              이메일
            </Label>
            <Input
              autoComplete="email"
              className="h-16 rounded-lg bg-surface-base px-5 text-xl sm:text-2xl"
              id="email"
              placeholder="이메일 주소"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-danger">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </Field>

          <Field className="gap-2">
            <Label className="text-lg font-medium" htmlFor="password">
              비밀번호
            </Label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className="h-16 rounded-lg bg-surface-base px-5 pr-14 text-xl sm:text-2xl"
                id="password"
                placeholder="10자 이상, 숫자와 특수문자 포함"
                type={showPassword ? "text" : "password"}
                {...form.register("password")}
              />
              <button
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-500 transition hover:bg-surface-sunken hover:text-ink-900"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden size={24} />
                ) : (
                  <Eye aria-hidden size={24} />
                )}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-sm text-danger">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </Field>
        </fieldset>

        <fieldset className="grid gap-5">
          <legend className="flex items-start gap-4 text-2xl font-bold text-ink-900">
            <input
              className="mt-1 size-6 rounded border-line bg-surface-elevated"
              checked={allRequiredConsents}
              onChange={(event) => {
                const checked = event.target.checked;
                for (const [key] of consentItems) {
                  form.setValue(key, checked, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }
              }}
              type="checkbox"
            />
            <span>
              필수 약관 전체 동의
              <span className="mt-1 block text-lg font-normal leading-relaxed text-ink-700">
                서비스 이용약관, 개인정보 처리방침, 민감정보 처리 동의를 포함합니다.
              </span>
            </span>
          </legend>

          <div className="ml-4 grid gap-5 border-l-4 border-brand-50 pl-10">
            {consentItems.map(([key, label, href]) => (
              <label
                className="flex items-center justify-between gap-4 text-xl text-ink-900"
                key={key}
              >
                <span className="flex items-center gap-4">
                  <input
                    className="size-8 rounded border-line bg-surface-elevated"
                    type="checkbox"
                    {...form.register(key as keyof SignupValues)}
                  />
                  {label}
                </span>
                <Link
                  className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 hover:underline"
                  href={href as never}
                >
                  보기
                </Link>
              </label>
            ))}
          </div>

          {form.formState.errors.tos ||
          form.formState.errors.privacy ||
          form.formState.errors.sensitive ? (
            <p className="text-sm text-danger">필수 동의 항목을 모두 확인해주세요.</p>
          ) : null}
        </fieldset>

        <Button
          className="h-16 rounded-lg bg-ink-900 text-xl font-bold text-surface-elevated hover:bg-ink-700"
          disabled={!isHydrated || form.formState.isSubmitting}
          type="submit"
        >
          가입하기
          <ArrowRight aria-hidden size={22} />
        </Button>

        <p className="text-center text-xl text-ink-700">
          이미 계정이 있으신가요?{" "}
          <Link className="font-semibold text-brand-600 hover:underline" href="/login">
            로그인
          </Link>
        </p>

        {message ? (
          <div role="alert">
            <InlineMessage tone={message.includes("완료") ? "brand" : "danger"}>
              <span className="inline-flex items-center gap-2">
                {message.includes("완료") ? (
                  <ShieldCheck aria-hidden size={18} />
                ) : (
                  <UserPlus aria-hidden size={18} />
                )}
                {message}
              </span>
            </InlineMessage>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function signupErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    consent_required: "필수 약관 동의를 모두 확인해주세요.",
    email_exists: "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정해주세요.",
    invalid_request: "입력값을 다시 확인해주세요.",
    weak_password: "비밀번호는 10자 이상이며 숫자와 특수문자를 포함해야 합니다."
  };
  return (
    labels[code ?? ""] ?? "가입을 완료하지 못했습니다. 입력값을 다시 확인해주세요."
  );
}
