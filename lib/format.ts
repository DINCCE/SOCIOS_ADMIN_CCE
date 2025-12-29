import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Formats a date relative to now (e.g., "hace 2 días")
 */
export function formatRelativeDate(date: Date | string | number) {
    const d = typeof date === "string" ? new Date(date) : date
    return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

/**
 * Formats a date in a short, formal format (e.g., "24 oct 2024")
 */
export function formatShortDate(date: Date | string | number) {
    const d = typeof date === "string" ? new Date(date) : date
    return format(d, "dd MMM yyyy", { locale: es })
}

/**
 * Common class for tabular numbers in CSS
 */
export const TABULAR_NUMS = "font-variant-numeric: tabular-nums"
