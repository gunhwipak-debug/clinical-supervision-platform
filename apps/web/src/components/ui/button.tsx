import type { ButtonHTMLAttributes } from "react";

import { Slot } from "./slot";
import { cn } from "../../lib/ui/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
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
  sm: "h-11 px-3 text-sm",
  md: "h-11 px-4 text-base",
  lg: "h-12 px-5 text-base"
} as const;

export function Button({
  asChild = false,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (asChild) {
    return <Slot className={buttonClassName} {...props} />;
  }

  return <button className={buttonClassName} {...props} />;
}
