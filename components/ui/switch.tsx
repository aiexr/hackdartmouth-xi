"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "toggle toggle-primary peer inline-flex h-6 w-11 items-center rounded-none p-0.5 transition-colors data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="toggle-circle block size-5 rounded-none bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}
