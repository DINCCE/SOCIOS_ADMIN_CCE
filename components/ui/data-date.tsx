import { formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { NullCell } from "./null-cell"

interface DataDateProps {
    date: string | Date | number | null | undefined
    className?: string
}

export function DataDate({ date, className }: DataDateProps) {
    if (!date) return <NullCell className={className} />

    return (
        <span className={cn("text-sm tabular-nums", className)}>
            {formatShortDate(date)}
        </span>
    )
}
