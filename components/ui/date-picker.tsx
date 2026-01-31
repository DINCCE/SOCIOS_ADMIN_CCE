"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
    dateDisplayFormat?: "PPP" | "dd/MM/yyyy" | "dd MMM yy"
}


export function DatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    disabled = false,
    fromYear = 1900,
    toYear = new Date().getFullYear(),
    captionLayout = "dropdown",
    className,
    dateDisplayFormat = "PPP",
}: DatePickerProps) {
    // Convert value to Date object if it's a string
    const dateValue = React.useMemo(() => {
        if (!value) return undefined
        if (value instanceof Date) return value
        const dateStr = typeof value === "string" ? value : ""
        if (dateStr.includes("T")) {
            return new Date(dateStr)
        }
        return new Date(dateStr + "T12:00:00")
    }, [value])

    // Format date based on dateDisplayFormat prop
    const formattedDate = React.useMemo(() => {
        if (!dateValue) return null
        switch (dateDisplayFormat) {
            case "dd/MM/yyyy":
                return format(dateValue, "dd/MM/yyyy")
            case "dd MMM yy":
                return format(dateValue, "dd MMM yy", { locale: es })
            case "PPP":
            default:
                return format(dateValue, "PPP", { locale: es })
        }
    }, [dateValue, dateDisplayFormat])

    const handleSelect = React.useCallback(
        (date: Date | undefined) => {
            if (!onChange) return
            if (!date) {
                onChange(undefined)
                return
            }
            const formatted = format(date, "yyyy-MM-dd")
            onChange(formatted)
        },
        [onChange]
    )

    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
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
                    {formattedDate ? (
                        <span>{formattedDate}</span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3" style={{ width: '340px' }}>
                    <DayPicker
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => {
                            handleSelect(date)
                            setOpen(false)
                        }}
                        disabled={disabled}
                        captionLayout={captionLayout}
                        startMonth={new Date(fromYear, 0, 1)}
                        endMonth={new Date(toYear, 11, 31)}
                        locale={es}
                        className="rdp rdp-v9"
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
