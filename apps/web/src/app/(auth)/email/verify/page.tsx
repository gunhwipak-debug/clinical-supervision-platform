import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { VerifyForm } from "./verify-form";

export default function EmailVerifyPage() {
  return (
    <main className="min-h-screen bg-surface-base text-ink-900">
      <header className="grid h-24 grid-cols-[44px_1fr_44px] items-center border-b border-line bg-surface-elevated px-8">
        <Link aria-label="로그인으로 돌아가기" href="/login">
          <ArrowLeft aria-hidden size={32} />
        </Link>
        <h1 className="text-center text-3xl font-bold">이메일 인증</h1>
        <MailCheck aria-hidden className="justify-self-end text-brand-600" size={30} />
      </header>
      <div className="mx-auto w-full max-w-[680px] px-8 py-16">
        <VerifyForm />
      </div>
    </main>
  );
}
