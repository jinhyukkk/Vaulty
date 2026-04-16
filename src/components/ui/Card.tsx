import * as React from "react";
import { cx } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx(
      "rounded-lg border border-gray-200 bg-white p-6 text-gray-900 shadow-sm",
      "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
