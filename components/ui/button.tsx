import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-forest-500 text-white shadow-sm hover:bg-forest-600 active:bg-forest-700",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-forest-500/30 bg-transparent text-forest-700 shadow-sm hover:bg-forest-500 hover:text-white",
        secondary:
          "bg-cream-100 text-forest-700 shadow-sm hover:bg-cream-200",
        ghost:
          "text-forest-700 hover:bg-forest-50 hover:text-forest-800",
        link:
          "text-forest-600 underline-offset-4 hover:underline",
        amber:
          "bg-amber-300 text-forest-800 shadow-sm hover:bg-amber-400 active:bg-amber-500 font-semibold",
        terracotta:
          "bg-terracotta-500 text-white shadow-sm hover:bg-terracotta-600 active:bg-terracotta-700 font-semibold",
        "outline-dark":
          "border-2 border-forest-700 bg-transparent text-forest-700 shadow-sm hover:bg-forest-700 hover:text-white font-semibold",
        "outline-light":
          "border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/50",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
