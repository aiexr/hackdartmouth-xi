import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-white/85 px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/80",
        className,
      )}
      {...props}
    />
  );
}
