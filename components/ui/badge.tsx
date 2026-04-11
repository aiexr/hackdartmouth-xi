import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-white/80 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
