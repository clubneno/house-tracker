import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-glass text-sm font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-glass-sm hover:bg-primary/90 hover:shadow-glass",
        destructive:
          "bg-destructive text-destructive-foreground shadow-glass-sm hover:bg-destructive/90 hover:shadow-glass",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted hover:shadow-glass-sm",
        secondary:
          "bg-secondary text-foreground border border-border shadow-glass-sm hover:bg-secondary/80 hover:shadow-glass",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground hover:backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "glass hover:shadow-glass-lg hover:-translate-y-0.5",
        "glass-primary":
          "glass bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-glass-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-glass px-4",
        lg: "h-11 rounded-glass px-8",
        icon: "h-10 w-10",
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
