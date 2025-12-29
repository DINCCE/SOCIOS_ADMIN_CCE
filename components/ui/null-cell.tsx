import { cn } from "@/lib/utils"

interface NullCellProps {
    className?: string
}

export function NullCell({ className }: NullCellProps) {
    return (
        <span className={cn("text-muted-foreground/40 font-medium tabular-nums select-none", className)}>
            &mdash;
        </span>
    )
}
