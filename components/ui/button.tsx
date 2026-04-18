import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// design.md §2 — 48px minimum touch target baked into base styles.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safegate-primary focus-visible:ring-offset-2 focus-visible:ring-offset-safegate-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-safegate-primary text-safegate-bg hover:brightness-110 shadow-glow",
        secondary:
          "bg-safegate-surface text-slate-50 border border-slate-800 hover:border-safegate-primary/60",
        success:
          "bg-safegate-success text-safegate-bg hover:brightness-110 shadow-glow-success",
        danger:
          "bg-safegate-danger text-slate-50 hover:brightness-110 shadow-glow-danger",
        ghost:
          "text-slate-300 hover:bg-safegate-surface hover:text-slate-50",
      },
      size: {
        default: "min-h-[48px] px-6 py-3 text-base",
        lg: "min-h-[56px] px-8 py-4 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
