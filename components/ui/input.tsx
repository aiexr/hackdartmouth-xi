import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "input input-bordered w-full focus:input-primary",
        className,
      )}
      {...props}
    />
  );
}
