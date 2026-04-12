import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
<<<<<<< HEAD
        "min-h-28 w-full rounded-md border border-border bg-input-background px-4 py-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground",
=======
        "textarea textarea-bordered w-full min-h-28 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
>>>>>>> 5db4b3c (UI change)
        className,
      )}
      {...props}
    />
  );
}
