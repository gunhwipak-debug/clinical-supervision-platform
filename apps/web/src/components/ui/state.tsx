import { AlertCircle, FileSearch, Loader2 } from "lucide-react";
import { cn } from "../../lib/ui/cn";
import { Button } from "./button";
import { Card } from "./card";

export function EmptyState({
  title,
  description,
  action,
  variant = "compact"
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "compact" | "prominent";
}) {
  if (variant === "prominent") {
    return (
      <Card className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <EmptyStateContent description={description} title={title} prominent />
        {action ? (
          <div className="flex justify-start md:justify-end">{action}</div>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="grid gap-4 rounded-md border border-dashed border-line bg-surface-elevated p-4 md:grid-cols-[1fr_auto] md:items-center">
      <EmptyStateContent description={description} title={title} />
      {action ? (
        <div className="flex justify-start md:justify-end">{action}</div>
      ) : null}
    </div>
  );
}

function EmptyStateContent({
  description,
  prominent = false,
  title
}: {
  description: string;
  prominent?: boolean;
  title: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700",
          prominent ? "size-12" : "size-9"
        )}
      >
        <FileSearch aria-hidden size={prominent ? 24 : 18} />
      </div>
      <div className="min-w-0">
        <h2
          className={cn(
            "break-keep font-bold leading-tight text-ink-900",
            prominent ? "text-2xl" : "text-base"
          )}
        >
          {title}
        </h2>
        <p className="mt-1 max-w-2xl break-keep text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export function FocusState({
  title,
  description,
  action,
  label
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  label?: string;
}) {
  return (
    <section className="rounded-xl bg-ink-900 p-6 text-white">
      {label ? (
        <span className="inline-flex rounded-md bg-white px-3 py-1 text-sm font-bold text-brand-600">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          "grid gap-4 md:grid-cols-[1fr_auto] md:items-end",
          label ? "mt-6" : ""
        )}
      >
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
  return <EmptyState title={title} description={description} />;
}

export function LoadingState({
  label = "불러오는 중",
  variant = "compact"
}: {
  label?: string;
  variant?: "compact" | "prominent";
}) {
  if (variant === "prominent") {
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

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-line bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink-700"
      aria-live="polite"
    >
      <Loader2 className="animate-spin" aria-hidden size={18} />
      {label}
    </div>
  );
}

export function ErrorState({
  code,
  title = "잠시 흐름이 끊겼어요",
  variant = "compact"
}: {
  code: string;
  title?: string;
  variant?: "compact" | "prominent";
}) {
  const content = (
    <>
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
    </>
  );

  if (variant === "prominent") {
    return <Card className="grid gap-3 border-danger/30">{content}</Card>;
  }

  return (
    <div className="grid gap-3 rounded-md border border-danger/30 bg-surface-elevated p-4">
      {content}
    </div>
  );
}
