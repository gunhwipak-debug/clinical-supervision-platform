import { cloneElement, isValidElement } from "react";

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

export function Slot({ children, ...props }: SlotProps) {
  if (isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      ...props,
      className: [children.props.className, props.className].filter(Boolean).join(" ")
    });
  }

  return null;
}
