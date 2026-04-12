import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-base-300 bg-input-background px-4 py-3 text-sm text-base-content outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-base-content/60",
        className,
      )}
      {...props}
    />
  );
}
