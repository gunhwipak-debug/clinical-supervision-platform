import { AlertCircle, FileSearch, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
          <FileSearch aria-hidden size={24} />
        </div>
        <div className="min-w-0">
          <h2 className="break-keep text-2xl font-bold leading-tight text-ink-900">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl break-keep text-sm leading-relaxed text-ink-500">
            {description}
          </p>
        </div>
      </div>
      {action ? (
        <div className="flex justify-start md:justify-end">{action}</div>
      ) : null}
    </Card>
  );
}

export function FocusState({
  title,
  description,
  action,
  label = "다음 행동"
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  label?: string;
}) {
  return (
    <section className="rounded-xl bg-ink-900 p-6 text-white">
      <span className="inline-flex rounded-md bg-white px-3 py-1 text-sm font-bold text-brand-600">
        {label}
      </span>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 className="break-keep text-2xl font-bold leading-tight md:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl break-keep text-base leading-8 text-slate-200">
            {description}
          </p>
        </div>
        {action}
      </div>
    </section>
  );
}

export function CompactEmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-elevated p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
          <FileSearch aria-hidden size={28} />
        </div>
        <div>
          <h3 className="font-bold text-ink-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ label = "불러오는 중" }: { label?: string }) {
  return (
    <Card className="grid gap-4" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <Loader2 className="animate-spin" aria-hidden size={18} />
        {label}
      </div>
      <div className="h-4 rounded-md bg-surface-sunken" />
      <div className="h-4 w-3/4 rounded-md bg-surface-sunken" />
      <div className="h-24 rounded-md bg-surface-sunken" />
    </Card>
  );
}

export function ErrorState({
  code,
  title = "잠시 흐름이 끊겼어요"
}: {
  code: string;
  title?: string;
}) {
  return (
    <Card className="grid gap-3 border-danger/30">
      <div className="flex items-center gap-2 text-danger">
        <AlertCircle aria-hidden size={20} />
        <h2 className="font-bold">{title}</h2>
      </div>
      <p className="text-sm text-ink-500">
        다시 시도해도 반복되면 아래 코드를 함께 전달해주세요.
      </p>
      <code className="w-fit rounded-sm bg-surface-sunken px-2 py-1 text-xs text-ink-700">
        {code}
      </code>
      <Button type="button" variant="secondary">
        다시 시도
      </Button>
    </Card>
  );
}
