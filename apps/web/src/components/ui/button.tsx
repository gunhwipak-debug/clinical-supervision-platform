import { Slot } from "./slot";
import { cn } from "../../lib/ui/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-brand-600 text-surface-elevated hover:bg-brand-700",
  secondary:
    "border border-line bg-surface-elevated text-ink-900 hover:bg-surface-sunken",
  ghost: "text-ink-700 hover:bg-surface-sunken",
  danger: "bg-danger text-surface-elevated hover:opacity-90"
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
} as const;

export function Button({
  asChild = false,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
