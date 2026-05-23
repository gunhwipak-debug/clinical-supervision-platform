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
    <Card className="grid justify-items-center gap-3 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-md bg-brand-50 text-brand-700">
        <FileSearch aria-hidden size={28} />
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="max-w-md text-sm text-ink-500">{description}</p>
      {action}
    </Card>
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
