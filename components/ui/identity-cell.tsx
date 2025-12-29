import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-colors"

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

    const colors = getAvatarColor(name)

    return (
        <div className={cn("flex items-center gap-3 py-1", className)}>
            <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                {image && <AvatarImage src={image} alt={name} />}
                <AvatarFallback
                    className={cn(
                        "text-[10px] font-bold",
                        colors.bg,
                        colors.text
                    )}
                >
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
                <span className="truncate font-bold text-foreground leading-tight">
                    {name}
                </span>
                {subtitle && (
                    <span className="truncate text-[11px] text-muted-foreground/70 leading-tight mt-0.5">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    )
}
