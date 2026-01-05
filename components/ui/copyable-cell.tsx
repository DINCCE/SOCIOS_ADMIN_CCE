"use client"

import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface CopyableCellProps {
  value: string
  label?: ReactNode // Lo que se muestra (si es diferente al valor copiado)
  className?: string
}

export function CopyableCell({ value, label, className }: CopyableCellProps) {
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar abrir el drawer de la fila
    navigator.clipboard.writeText(value)
    toast.success("Copiado al portapapeles", {
      description: value,
      duration: 1500
    })
  }

  return (
    <span
      onClick={onCopy}
      className={cn(
        "cursor-pointer hover:text-primary hover:underline hover:decoration-dotted underline-offset-4 transition-colors truncate block",
        className
      )}
      title="Click para copiar"
    >
      {label || value}
    </span>
  )
}
