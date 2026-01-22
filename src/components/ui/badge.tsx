import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-3 py-0.5 text-xs font-medium transition-all duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground shadow-glass-sm hover:bg-primary hover:shadow-glass",
        secondary:
          "border-transparent bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:bg-secondary",
        destructive:
          "border-transparent bg-destructive/90 text-destructive-foreground shadow-glass-sm hover:bg-destructive hover:shadow-glass",
        outline:
          "text-foreground glass-subtle",
        success:
          "border-transparent bg-green-500/90 text-white shadow-glass-sm hover:bg-green-500 hover:shadow-glass",
        warning:
          "border-transparent bg-yellow-500/90 text-white shadow-glass-sm hover:bg-yellow-500 hover:shadow-glass",
        glass:
          "glass text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
