"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    value?: string | Date | null
    onChange?: (date: string | undefined) => void
    placeholder?: string
    disabled?: boolean
    fromYear?: number
    toYear?: number
    captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
    className?: string
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    disabled = false,
    fromYear,
    toYear,
    captionLayout,
    className,
}: DatePickerProps) {
    // Convert value to Date object if it's a string
    const dateValue = React.useMemo(() => {
        if (!value) return undefined
        if (value instanceof Date) return value
        // Handle both ISO strings and date-only strings (YYYY-MM-DD)
        const dateStr = typeof value === "string" ? value : ""
        if (dateStr.includes("T")) {
            return new Date(dateStr)
        }
        // For date-only strings, append time to avoid timezone issues
        return new Date(dateStr + "T12:00:00")
    }, [value])

    const handleSelect = React.useCallback(
        (date: Date | undefined) => {
            if (!onChange) return
            if (!date) {
                onChange(undefined)
                return
            }
            // Always return YYYY-MM-DD format for consistency
            const formatted = format(date, "yyyy-MM-dd")
            onChange(formatted)
        },
        [onChange]
    )

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateValue && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? (
                        format(dateValue, "PPP", { locale: es })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={handleSelect}
                    disabled={disabled}
                    initialFocus
                    captionLayout={captionLayout}
                    fromYear={fromYear}
                    toYear={toYear}
                    locale={es}
                />
            </PopoverContent>
        </Popover>
    )
}
