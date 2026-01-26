"use client"

import * as React from "react"
import { Search, X, AlertTriangle, Clock, Circle, PauseCircle, ArrowRightCircle, CheckCircle2, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface FilterState {
    search: string
    soloUrgentes: boolean
    soloHoy: boolean
    pausadas: boolean
    enProgreso: boolean
    proximosDias: boolean
    terminadas: boolean
}

interface MisTareasFastFilterProps {
    filterState: FilterState
    onFilterChange: (filters: FilterState) => void
    activeFilterCount: number
}

export function MisTareasFastFilter({
    filterState,
    onFilterChange,
    activeFilterCount,
}: MisTareasFastFilterProps) {
    const [open, setOpen] = React.useState(false)

    const handleSearchChange = (value: string) => {
        onFilterChange({ ...filterState, search: value })
    }

    const toggleFilter = (key: keyof Omit<FilterState, "search">) => {
        onFilterChange({ ...filterState, [key]: !filterState[key] })
    }

    const clearAll = () => {
        onFilterChange({
            search: "",
            soloUrgentes: false,
            soloHoy: false,
            pausadas: false,
            enProgreso: false,
            proximosDias: false,
            terminadas: false,
        })
        setOpen(false)
    }

    const hasActiveFilters = activeFilterCount > 0

    return (
        <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar tareas..."
                    value={filterState.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 h-8 text-sm pr-8"
                />
                {filterState.search && (
                    <button
                        onClick={() => handleSearchChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Filter button with popover */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-8 gap-1.5 text-xs font-medium",
                            hasActiveFilters && "border-primary/50"
                        )}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        Filtros
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                            Filtros rápidos
                        </div>

                        {/* Urgentes */}
                        <Button
                            variant={filterState.soloUrgentes ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter("soloUrgentes")}
                            className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                filterState.soloUrgentes && "bg-status-negative text-status-negative-foreground hover:bg-status-negative/90"
                            )}
                        >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Urgentes
                        </Button>

                        {/* Para hoy */}
                        <Button
                            variant={filterState.soloHoy ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter("soloHoy")}
                            className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                filterState.soloHoy && "bg-chart-4 text-chart-4-foreground hover:bg-chart-4/90"
                            )}
                        >
                            <Clock className="h-3.5 w-3.5" />
                            Para hoy
                        </Button>

                        {/* Pausadas */}
                        <Button
                            variant={filterState.pausadas ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter("pausadas")}
                            className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                filterState.pausadas && "bg-chart-5 text-chart-5-foreground hover:bg-chart-5/90"
                            )}
                        >
                            <PauseCircle className="h-3.5 w-3.5" />
                            Pausadas
                        </Button>

                        {/* En Progreso */}
                        <Button
                            variant={filterState.enProgreso ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter("enProgreso")}
                            className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                filterState.enProgreso && "bg-chart-3 text-chart-3-foreground hover:bg-chart-3/90"
                            )}
                        >
                            <ArrowRightCircle className="h-3.5 w-3.5" />
                            En Progreso
                        </Button>

                        {/* Próximos días */}
                        <Button
                            variant={filterState.proximosDias ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter("proximosDias")}
                            className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                filterState.proximosDias && "bg-chart-2 text-chart-2-foreground hover:bg-chart-2/90"
                            )}
                        >
                            <Circle className="h-3.5 w-3.5" />
                            Próximos 7 días
                        </Button>

                        {/* Terminadas */}
                        <Button
                            variant={filterState.terminadas ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter("terminadas")}
                            className={cn(
                                "w-full justify-start gap-2 h-8 text-xs",
                                filterState.terminadas && "bg-status-positive text-status-positive-foreground hover:bg-status-positive/90"
                            )}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Terminadas
                        </Button>

                        {hasActiveFilters && (
                            <>
                                <div className="h-px bg-border my-2" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAll}
                                    className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Limpiar filtros
                                </Button>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
