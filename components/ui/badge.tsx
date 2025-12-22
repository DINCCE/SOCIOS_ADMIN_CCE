import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        // Soft Radiance Status Variants
        "status-active": "border bg-emerald-500/10 text-emerald-700 dark:text-emerald-600 border-emerald-500/20",
        "status-inactive": "border bg-rose-500/10 text-rose-700 dark:text-rose-600 border-rose-500/20",
        "status-pending": "border bg-amber-500/10 text-amber-700 dark:text-amber-600 border-amber-500/20",
        "status-suspended": "border bg-rose-500/10 text-rose-700 dark:text-rose-600 border-rose-500/20",
        "status-draft": "border bg-slate-500/10 text-slate-700 dark:text-slate-600 border-slate-500/20",
        // Soft Radiance Type Variants
        "type-primary": "border bg-blue-500/10 text-blue-700 dark:text-blue-600 border-blue-500/20",
        "type-secondary": "border bg-violet-500/10 text-violet-700 dark:text-violet-600 border-violet-500/20",
        "type-outline": "border bg-slate-500/10 text-slate-700 dark:text-slate-600 border-slate-500/20",
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
  dotAnimation?: "pulse" | "none"
}

function Badge({ className, variant, showDot = false, dotAnimation = "none", children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            dotAnimation === "pulse" && "animate-pulse",
            // Match dot color to text color based on variant
            variant?.includes("emerald") && "bg-emerald-600",
            variant?.includes("rose") && "bg-rose-600",
            variant?.includes("amber") && "bg-amber-600",
            variant?.includes("slate") && "bg-slate-600",
            variant?.includes("blue") && "bg-blue-600",
            variant?.includes("violet") && "bg-violet-600"
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
