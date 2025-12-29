"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FormattedNumberProps {
    value: string | number | null | undefined
    type: 'phone' | 'document'
    className?: string
    copyable?: boolean
}

/**
 * FormattedNumber - Unified component for phone and document formatting
 * 
 * - type="phone": Pattern 300 123 4567 (Colombian mobile)
 * - type="document": Pattern 1.234.567.890 (Thousands separators)
 * 
 * Styling: sans-serif, tabular-nums, text-xs, text-slate-600
 */
export function FormattedNumber({
    value,
    type,
    className,
    copyable = true
}: FormattedNumberProps) {
    const [copied, setCopied] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    if (value === null || value === undefined || value === "") {
        return <span className="text-muted-foreground/50 ml-1">—</span>
    }

    const stringValue = String(value)
    const cleanValue = stringValue.replace(/\D/g, "")

    let formattedValue = stringValue

    if (type === 'phone') {
        if (cleanValue.length === 10) {
            formattedValue = `${cleanValue.slice(0, 3)}\u00A0${cleanValue.slice(3, 6)}\u00A0${cleanValue.slice(6)}`
        }
    } else if (type === 'document') {
        if (cleanValue.length > 0) {
            formattedValue = new Intl.NumberFormat('es-CO').format(Number(cleanValue))
        }
    }

    const handleCopy = async (e: React.MouseEvent) => {
        if (!copyable) return
        e.stopPropagation()

        try {
            await navigator.clipboard.writeText(cleanValue)
            setCopied(true)
            toast.success(`${type === 'phone' ? 'Teléfono' : 'Documento'} copiado`, {
                description: cleanValue,
                duration: 2000,
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error("Error al copiar")
        }
    }

    const baseStyles = "tabular-nums text-xs tracking-wide text-slate-600 whitespace-nowrap"

    if (!copyable) {
        return (
            <span className={cn(baseStyles, className)}>
                {formattedValue}
            </span>
        )
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-muted cursor-pointer",
                baseStyles,
                className
            )}
            aria-label={`Copiar ${cleanValue}`}
        >
            <span>{formattedValue}</span>
            {(isHovered || copied) && (
                <span className="shrink-0">
                    {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                        <Copy className="h-3.5 w-3.5 opacity-50" />
                    )}
                </span>
            )}
        </button>
    )
}
