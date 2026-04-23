import * as React from "react";
import { cx } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx(
      "rounded-vault border border-vaulty-line bg-vaulty-surface p-[18px] text-vaulty-ink",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
