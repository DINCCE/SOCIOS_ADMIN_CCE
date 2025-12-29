import { cn } from "@/lib/utils"

interface DataEnumProps {
    value?: string | null
    className?: string
}

export function DataEnum({ value, className }: DataEnumProps) {
    if (!value) return null

    const humanized = value
        .replace(/_/g, " ")
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")

    return (
        <span className={cn("text-sm", className)}>
            {humanized}
        </span>
    )
}
