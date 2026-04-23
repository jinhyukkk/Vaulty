import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx, focusRing } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-vaulty-accent text-vaulty-surface hover:bg-vaulty-ink",
  secondary:
    "border border-vaulty-line bg-vaulty-surface text-vaulty-ink hover:bg-vaulty-surfaceAlt",
  ghost:
    "text-vaulty-inkSoft hover:bg-vaulty-surfaceAlt",
  destructive:
    "bg-vaulty-down text-vaulty-surface hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cx(
          "inline-flex items-center justify-center rounded-vault font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          focusRing,
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
