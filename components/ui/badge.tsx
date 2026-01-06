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
        // Custom variants for status badges
        "status-active":
          "border-transparent bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        "status-inactive":
          "border-transparent bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
        "status-destructive":
          "border-transparent bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
        "status-warning":
          "border-transparent bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
        "status-neutral":
          "border-transparent bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
        // Custom variant for metadata badges
        "metadata-outline":
          "border-border/50 bg-background/50 text-muted-foreground hover:bg-background",
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
}

function Badge({ className, variant, showDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
