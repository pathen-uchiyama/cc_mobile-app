import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-sans active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // ── Brand variants ─────────────────────────────────────────────
        // Obsidian — the heaviest commit. Mirrors /book-ll sticky ribbon.
        obsidian:
          "bg-[hsl(var(--obsidian))] text-[hsl(var(--parchment))] shadow-boutique hover:shadow-boutique-hover",
        // Gold — the strategic signal. Soft-tint surface with gold ink.
        gold:
          "bg-[hsl(var(--gold)_/_0.12)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)_/_0.4)] hover:bg-[hsl(var(--gold)_/_0.18)]",
        // Ghost-gold — a quieter strategic action; no fill, gold ink.
        "ghost-gold":
          "bg-transparent text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)_/_0.08)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Touch-target safe minimums for the boutique surfaces.
        touch: "min-h-[44px] px-4 py-2.5 rounded-2xl text-[12px]",
        commit: "min-h-[52px] px-5 py-4 rounded-2xl text-[13px] font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
