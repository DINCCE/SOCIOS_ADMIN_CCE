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
        // SaaS 2025 Standardized Statuses
        "status-active": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        "status-inactive": "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
        "status-warning": "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
        "status-destructive": "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",

        // Metadata / Secondary Info
        "metadata-outline": "bg-transparent border border-slate-200 text-slate-500 font-mono text-[10px] h-5 px-1.5 shadow-none",

        // Compatibility / Utility variants
        "status-neutral": "border text-muted-foreground border-border bg-transparent shadow-none font-medium",
        "status-muted": "border bg-secondary/30 text-muted-foreground/80 border-transparent shadow-none",
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
            (variant === "status-active" || variant?.includes("emerald")) && "bg-emerald-600",
            (variant === "status-destructive" || variant?.includes("rose") || variant?.includes("destructive")) && "bg-rose-600",
            (variant === "status-warning" || variant?.includes("amber")) && "bg-amber-600",
            (variant === "status-inactive" || variant?.includes("slate")) && "bg-slate-600",
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
