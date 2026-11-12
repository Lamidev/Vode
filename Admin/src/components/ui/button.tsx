import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E63F4]/40",
  {
    variants: {
      variant: {
        default: "bg-[#090D16] text-white hover:bg-[#1A202C] shadow-xs",
        primary: "bg-[#0E63F4] text-white hover:bg-[#0B52CC] shadow-xs",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-xs",
        success: "bg-[#00B875] text-white hover:bg-[#009E64] shadow-xs",
        outline: "border border-slate-200 bg-white text-[#090D16] hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-[#090D16]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

