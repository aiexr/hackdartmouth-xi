import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "badge badge-neutral inline-flex items-center text-[0.7rem] font-medium uppercase tracking-[0.18em]",
        className,
      )}
      {...props}
    />
  );
}
