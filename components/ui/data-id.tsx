"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DataIdProps {
  children: React.ReactNode
  className?: string
  copyable?: boolean
}

/**
 * DataId - Monospace component for technical identifiers with copy-to-clipboard
 *
 * Use for: business partner codes, NITs, UUIDs, account numbers, etc.
 * Auto-reduces font size by 1 step for visual balance.
 * Hovering shows a copy icon, clicking copies to clipboard with toast confirmation.
 *
 * @example
 * ```tsx
 * <DataId copyable>BP-2024-001</DataId>
 * <DataId copyable>900123456-7</DataId>
 * <DataId>550e8400-e29b-41d4-a716-446655440000</DataId>
 * ```
 */
export function DataId({ children, className, copyable = true }: DataIdProps) {
  const [copied, setCopied] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleCopy = async () => {
    if (!copyable) return

    const text = String(children)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copiado al portapapeles", {
        description: text,
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Error al copiar", {
        description: "No se pudo copiar al portapapeles",
      })
    }
  }

  if (!copyable) {
    return (
      <span className={cn("font-mono text-xs font-medium tracking-tight", className)}>
        {children}
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
        "group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-xs font-medium tracking-tight transition-colors hover:bg-muted",
        className
      )}
      aria-label={`Copiar ${children}`}
    >
      <span>{children}</span>
      {(isHovered || copied) && (
        <span className="transition-opacity">
          {copied ? (
            <Check className="h-3 w-3 text-emerald-600" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
      )}
    </button>
  )
}
