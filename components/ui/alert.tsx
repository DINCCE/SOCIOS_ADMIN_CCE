import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
    "relative w-full rounded-lg border border-l-4 px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground border-l-muted-foreground/30",
                destructive:
                    "border-destructive/20 border-l-destructive text-destructive bg-destructive/5 dark:text-destructive [&>svg]:text-destructive",
                warning: "border-amber-500/20 border-l-amber-500 text-amber-900 bg-amber-50/30 dark:text-amber-500 [&>svg]:text-amber-600",
                info: "border-blue-500/20 border-l-blue-500 text-blue-900 bg-blue-50/30 dark:text-blue-500 [&>svg]:text-blue-600",
                compact: "py-2 px-3 [&>svg]:top-2.5 [&>svg]:left-3 [&>svg~*]:pl-6 border-l-muted-foreground/30"
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
    />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-xs [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
