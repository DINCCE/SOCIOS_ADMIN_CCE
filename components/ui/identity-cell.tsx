import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface IdentityCellProps {
    name: string
    subtitle?: string | null
    image?: string | null
    className?: string
}

export function IdentityCell({ name, subtitle, image, className }: IdentityCellProps) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)

    return (
        <div className={cn("flex items-center gap-3 py-1", className)}>
            <Avatar className="h-8 w-8 border border-slate-200/60 shadow-sm shrink-0">
                {image && <AvatarImage src={image} alt={name} />}
                <AvatarFallback className="text-[10px]">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 space-y-0.5">
                <span className="truncate font-medium text-sm text-foreground leading-tight">
                    {name}
                </span>
                {subtitle && (
                    <span className="truncate text-xs text-slate-500 leading-tight">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    )
}
