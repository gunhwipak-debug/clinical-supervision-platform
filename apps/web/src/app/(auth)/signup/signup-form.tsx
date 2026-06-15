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
    try {
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
      const body = (await readApiBody(response)) as { error?: { code: string } };
      const nextMessage = response.ok
        ? "가입 요청이 완료되었습니다. 이메일 인증을 진행해주세요."
        : signupErrorMessage(body.error?.code);
      setMessage(nextMessage);
      if (response.ok) {
        toast.success("가입 요청 완료");
      } else {
        toast.error(nextMessage);
      }
    } catch {
      const nextMessage = signupErrorMessage("server_unavailable");
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  return (
    <AuthPanel
      description="가입 후 필요한 경우 슈퍼바이저 신청을 진행할 수 있습니다."
      notes={[
        "모든 사용자는 먼저 신청자 계정으로 시작합니다.",
        "이메일 인증을 마쳐야 의뢰와 기록 화면을 사용할 수 있습니다."
      ]}
      size="wide"
      title="계정 만들기"
    >
      <form className="grid gap-5" method="post" onSubmit={form.handleSubmit(submit)}>
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
          <Label className="text-sm font-semibold text-[#8b94ad]" htmlFor="password">
            비밀번호
          </Label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="h-12 rounded-[16px] border-[#e7ebf1] bg-[#f8faff] px-4 pr-12 text-base shadow-none placeholder:text-[#94a0bc] focus-visible:outline-[#2563ff]"
              id="password"
              placeholder="10자 이상, 숫자와 특수문자 포함"
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

        <fieldset className="grid gap-3 rounded-[20px] border border-[#e7ebf1] bg-[#fbfcff] p-4">
          <legend className="sr-only">필수 동의</legend>
          <label className="flex items-start gap-3 text-sm font-semibold text-[#081225]">
            <input
              checked={allRequiredConsents}
              className="mt-1 size-5 rounded border-[#cdd5e2]"
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
              <span className="mt-1 block text-sm font-normal leading-7 text-[#5f6c8f]">
                서비스 이용약관, 개인정보 처리방침, 민감정보 처리 동의를 포함합니다.
              </span>
            </span>
          </label>

          {consentItems.map(([key, label, href]) => (
            <label
              className="flex items-center justify-between gap-3 rounded-[16px] border border-[#e7ebf1] bg-white px-4 py-3 text-sm font-semibold text-[#081225]"
              key={key}
            >
              <span className="flex items-center gap-3">
                <input
                  className="size-5 rounded border-[#cdd5e2]"
                  type="checkbox"
                  {...form.register(key as keyof SignupValues)}
                />
                {label}
              </span>
              <Link className="text-[#2563ff] hover:underline" href={href as never}>
                보기
              </Link>
            </label>
          ))}

          {form.formState.errors.tos ||
          form.formState.errors.privacy ||
          form.formState.errors.sensitive ? (
            <p className="text-sm text-[#c24141]">
              필수 동의 항목을 모두 확인해주세요.
            </p>
          ) : null}
        </fieldset>

        <Button
          className="h-12 rounded-[16px] bg-[#2563ff] text-base font-semibold text-white hover:bg-[#1f58e6]"
          disabled={!isHydrated || form.formState.isSubmitting}
          type="submit"
        >
          가입하기
        </Button>

        <p className="text-center text-sm leading-7 text-[#5f6c8f]">
          이미 계정이 있으신가요?{" "}
          <Link className="font-semibold text-[#2563ff] hover:underline" href="/login">
            로그인
          </Link>
        </p>

        {message ? (
          <div role="alert">
            <InlineMessage tone={message.includes("완료") ? "brand" : "danger"}>
              {message}
            </InlineMessage>
          </div>
        ) : null}
      </form>
    </AuthPanel>
  );
}

function signupErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    consent_required: "필수 약관 동의를 모두 확인해주세요.",
    email_exists: "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정해주세요.",
    invalid_request: "입력값을 다시 확인해주세요.",
    server_unavailable:
      "일시적인 문제로 가입할 수 없습니다. 잠시 후 다시 시도하거나 관리자에게 문의해주세요.",
    weak_password: "비밀번호는 10자 이상이며 숫자와 특수문자를 포함해야 합니다."
  };
  return (
    labels[code ?? ""] ?? "가입을 완료하지 못했습니다. 입력값을 다시 확인해주세요."
  );
}

async function readApiBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
