import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        "metadata-outline": "text-foreground gap-1.5",
        "status-active": "border-transparent bg-status-positive text-white shadow",
        "status-warning": "border-transparent bg-status-warning text-white shadow",
        "status-destructive": "border-transparent bg-status-negative text-white shadow",
        "status-neutral": "border-transparent bg-status-neutral text-white shadow",
        "status-inactive": "border-transparent bg-slate-400 text-white shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean
  dotClassName?: string
}

function Badge({ className, variant, showDot, dotClassName, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
