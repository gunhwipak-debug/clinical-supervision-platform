import { cn } from "../../lib/ui/cn";

export function Badge({
  className,
  tone = "brand",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "brand" | "accent" | "neutral" | "danger";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-100 text-ink-900",
    neutral: "bg-surface-sunken text-ink-700",
    danger: "bg-danger/10 text-danger"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
