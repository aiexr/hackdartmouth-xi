import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none",
  {
    variants: {
      variant: {
        default: "btn-primary text-primary-content",
        secondary: "bg-base-200 text-base-content border border-base-300 hover:bg-base-300",
        outline: "border border-base-300 bg-transparent text-base-content hover:bg-base-200",
        ghost: "bg-transparent text-base-content/60 border-0 hover:bg-base-200 hover:text-base-content",
        link: "bg-transparent text-primary border-0 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "btn-sm h-8 rounded-none px-3 text-xs",
        lg: "btn-lg h-10 rounded-none px-6 text-sm",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
