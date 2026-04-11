import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-3xl border border-border bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/80",
        className,
      )}
      {...props}
    />
  );
}
