"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps, type Formatters } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export type CalendarProps = DayPickerProps

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    // Formatters personalizados para versiones cortas de meses
    const formatters: Partial<Formatters> = {
        formatMonthDropdown: (month: Date) => {
            const monthStr = format(month, "MMM", { locale: es })
            // Capitalizar primera letra
            return monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
        },
    }

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            formatters={formatters}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center items-center pt-1 w-full",
                caption_label: "text-sm font-medium",
                button_next: "hidden",
                button_previous: "hidden",
                dropdowns: "flex gap-2",
                nav: "flex items-center justify-center w-full",
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex",
                weekday:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                week: "flex w-full mt-2",
                day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                range_end: "day-range-end",
                selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                today: "bg-accent text-accent-foreground",
                outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                disabled: "text-muted-foreground opacity-50",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" />
                    }
                    return <ChevronRight className="h-4 w-4" />
                },
                MonthCaption: ({ calendarMonth, children }) => {
                    return <>{children}</>
                },
                Dropdown: ({ value, onChange, options, ...props }) => {
                    const selected = options?.find((option) => option.value === value)
                    const handleChange = (newValue: string) => {
                        const changeEvent = {
                            target: { value: newValue },
                        } as React.ChangeEvent<HTMLSelectElement>
                        onChange?.(changeEvent)
                    }
                    return (
                        <Select
                            value={value?.toString()}
                            onValueChange={handleChange}
                        >
                            <SelectTrigger className="pr-1.5 focus:ring-0 w-fit">
                                <SelectValue>{selected?.label}</SelectValue>
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <ScrollArea className="h-80">
                                    {options?.map((option, id: number) => (
                                        <SelectItem key={`${option.value}-${id}`} value={option.value?.toString() ?? ""}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    )
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
