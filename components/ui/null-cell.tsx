import { cn } from "@/lib/utils"

interface NullCellProps {
    className?: string
    value?: string | number | null
}

export function NullCell({ className, value }: NullCellProps) {
    const displayValue = value === null || value === undefined || value === ""
    return (
        <span className={cn("text-muted-foreground/40 font-medium tabular-nums select-none", className)}>
            {displayValue ? "\u2014" : value}
        </span>
    )
}
