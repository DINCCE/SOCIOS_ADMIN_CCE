"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

// Type definition for location data
export interface Location {
    id: string
    city_name: string
    state_name: string | null
    country_name: string
    country_code: string
}

interface LocationPickerProps {
    value?: string // UUID of selected location
    onChange: (value: string | null) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

// Helper to get country flag emoji from ISO code
function getCountryFlag(countryCode: string): string {
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
}

export function LocationPicker({
    value,
    onChange,
    placeholder = "Buscar ciudad...",
    disabled = false,
    className,
}: LocationPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [locations, setLocations] = React.useState<Location[]>([])
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

    const supabase = createClient()

    // Fetch selected location display data on mount
    React.useEffect(() => {
        async function fetchLocationById(id: string) {
            const { data, error } = await supabase
                .from("geographic_locations")
                .select("id, city_name, state_name, country_name, country_code")
                .eq("id", id)
                .single()

            if (!error && data) {
                setSelectedLocation(data as Location)
            }
        }

        if (value && !selectedLocation) {
            fetchLocationById(value)
        }
    }, [value, selectedLocation, supabase])

    // Debounced search function
    React.useEffect(() => {
        if (searchTerm.length < 2) {
            setLocations([])
            return
        }

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Debounce 300ms
        timeoutRef.current = setTimeout(async () => {
            setIsLoading(true)
            try {
                const { data, error } = await supabase.rpc("search_locations", {
                    q: searchTerm,
                    max_results: 20,
                })

                if (!error && data) {
                    setLocations(data as Location[])
                } else {
                    setLocations([])
                }
            } catch (err) {
                console.error("Error searching locations:", err)
                setLocations([])
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [searchTerm, supabase])

    // Handle selection
    function handleSelect(location: Location) {
        setSelectedLocation(location)
        onChange(location.id)
        setOpen(false)
        setSearchTerm("")
    }

    // Handle clear
    function handleClear() {
        setSelectedLocation(null)
        onChange(null)
        setSearchTerm("")
    }

    // Display value in trigger button
    function getDisplayValue() {
        if (selectedLocation) {
            return `${selectedLocation.city_name}, ${selectedLocation.country_code}`
        }
        return placeholder
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "h-9 w-full justify-between font-normal",
                        !selectedLocation && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{getDisplayValue()}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {selectedLocation && (
                            <X
                                className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClear()
                                }}
                            />
                        )}
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex flex-col">
                    {/* Search Input */}
                    <div className="border-b p-3">
                        <Input
                            placeholder="Escribe al menos 2 letras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9"
                            autoFocus
                        />
                    </div>

                    {/* Results List */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {isLoading && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Buscando...
                            </div>
                        )}

                        {!isLoading && searchTerm.length < 2 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Escribe al menos 2 caracteres para buscar
                            </div>
                        )}

                        {!isLoading && searchTerm.length >= 2 && locations.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No se encontraron resultados
                            </div>
                        )}

                        {!isLoading && locations.length > 0 && (
                            <div className="p-1">
                                {locations.map((location) => {
                                    const isSelected = value === location.id
                                    return (
                                        <button
                                            key={location.id}
                                            onClick={() => handleSelect(location)}
                                            className={cn(
                                                "w-full flex items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors",
                                                "hover:bg-accent hover:text-accent-foreground",
                                                isSelected && "bg-accent/50"
                                            )}
                                        >
                                            {/* Flag */}
                                            <span className="text-xl shrink-0">
                                                {getCountryFlag(location.country_code)}
                                            </span>

                                            {/* City and Region Info */}
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="font-medium text-sm text-foreground truncate">
                                                    {location.city_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {location.state_name && `${location.state_name}, `}
                                                    {location.country_name}
                                                </span>
                                            </div>

                                            {/* Check icon if selected */}
                                            {isSelected && (
                                                <Check className="h-4 w-4 shrink-0 text-primary" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
