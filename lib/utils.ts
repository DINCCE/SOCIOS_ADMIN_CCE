import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatDocumentId(value: string | number | null | undefined): string {
    if (!value) return "—"
    const cleanValue = String(value).replace(/\D/g, "")
    return new Intl.NumberFormat("es-CO").format(Number(cleanValue))
}
