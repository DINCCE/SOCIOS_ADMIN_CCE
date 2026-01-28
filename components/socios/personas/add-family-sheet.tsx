"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Search, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { buscarPersonasDisponiblesParaRelacion } from "@/app/actions/personas"
import { vincularFamiliar } from "@/app/actions/relaciones"
import { NewPersonDialog } from "./new-person-dialog"

// Schema for validation
const addFamilySchema = z.object({
    persona_id: z.string().min(1, "Selecciona una persona"),
    relacion: z.enum(["cónyuge", "padre", "madre", "hijo/a", "suegro", "suegra", "hermano/a", "otro", "yerno", "nuera"]),
})

type AddFamilyFormValues = z.infer<typeof addFamilySchema>

interface PersonaBuscada {
    id: string
    codigo_bp: string
    nombre_completo: string
    identificacion: string
    telefono: string | null
    tipo_actor: string
    foto_url?: string | null
    already_linked?: boolean
}

interface AddFamilySheetProps {
    bp_origen_id: string
    organizacion_id: string
    onSuccess?: () => void
}

export function AddFamilySheet({ bp_origen_id, organizacion_id, onSuccess }: AddFamilySheetProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [comboboxOpen, setComboboxOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<PersonaBuscada[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showNewPersonDialog, setShowNewPersonDialog] = useState(false)
    const [createdPersonaId, setCreatedPersonaId] = useState<string | null>(null)
    const [selectedPersona, setSelectedPersona] = useState<PersonaBuscada | null>(null)

    const form = useForm<AddFamilyFormValues>({
        resolver: zodResolver(addFamilySchema),
        defaultValues: {
            persona_id: "",
            relacion: undefined,
        },
    })

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true)
                const result = await buscarPersonasDisponiblesParaRelacion(
                    bp_origen_id,
                    searchQuery,
                    organizacion_id
                )
                setSearchResults(result.success ? result.data : [])
                setIsSearching(false)
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, bp_origen_id, organizacion_id])

    // Reset state when sheet is closed
    useEffect(() => {
        if (!open) {
            setSelectedPersona(null)
            setSearchQuery("")
            setSearchResults([])
            form.reset()
        }
    }, [open, form])

    // Sync selectedPersona with form value
    useEffect(() => {
        const personaId = form.watch("persona_id")
        if (personaId && !selectedPersona) {
            // Try to find in search results first
            const found = searchResults.find(p => p.id === personaId)
            if (found) {
                setSelectedPersona(found)
            }
        } else if (!personaId && selectedPersona) {
            setSelectedPersona(null)
        }
    }, [form.watch("persona_id"), searchResults])

    // If a new person was created, fetch their details and pre-select
    useEffect(() => {
        async function loadCreatedPerson() {
            if (createdPersonaId) {
                setIsSearching(true)
                try {
                    // Search specifically for the newly created person
                    const result = await buscarPersonasDisponiblesParaRelacion(
                        bp_origen_id,
                        createdPersonaId,
                        organizacion_id
                    )

                    if (result.success && result.data.length > 0) {
                        const createdPerson = result.data[0]
                        // Pre-select the created person in the form
                        form.setValue('persona_id', createdPerson.id)
                        setSelectedPersona(createdPerson)
                        setSearchQuery(createdPerson.nombre_completo)
                        setSearchResults(result.data)
                        toast.success("Persona creada y seleccionada. Ahora selecciona el parentesco.")
                    } else {
                        toast.error("No se pudo encontrar la persona creada. Intenta buscarla manualmente.")
                    }
                } catch (error) {
                    console.error("Error loading created person:", error)
                    toast.error("Error al cargar la persona creada.")
                } finally {
                    setIsSearching(false)
                    setCreatedPersonaId(null) // Reset to avoid re-running
                }
            }
        }

        loadCreatedPerson()
    }, [createdPersonaId, bp_origen_id, organizacion_id, form])

    async function onSubmit(data: AddFamilyFormValues) {
        setIsPending(true)
        try {
            const result = await vincularFamiliar({
                bp_origen_id,
                bp_destino_id: data.persona_id,
                tipo_parentesco: data.relacion,
                descripcion: `Vinculado como ${data.relacion}`
            })

            if (result.success) {
                toast.success("Familiar vinculado correctamente")
                form.reset()
                setSelectedPersona(null)
                setSearchQuery("")
                setComboboxOpen(false)
                setOpen(false)
                onSuccess?.()
            } else {
                toast.error(result.message)
            }
        } catch (err) {
            console.error("Error linking family member:", err)
            toast.error("Error al vincular familiar")
        } finally {
            setIsPending(false)
        }
    }

    function getInitials(nombre: string) {
        return nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    function getFullName(persona: PersonaBuscada): string {
        return persona.nombre_completo
    }

    function getDocument(persona: PersonaBuscada): string {
        return persona.identificacion
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Añadir Familiar
                    </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
                    {/* Header Section */}
                    <div className="bg-background shrink-0 px-6 py-6 border-b">
                        <SheetHeader className="text-left">
                            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                                Vincular Familiar
                            </SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground mt-1">
                                Busca una persona existente para añadirla al núcleo familiar.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Form Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        <Form {...form}>
                            <form id="add-family-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                {/* Person Search Combobox */}
                                <FormField
                                    control={form.control}
                                    name="persona_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col gap-2">
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Buscar Persona
                                            </FormLabel>
                                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                !selectedPersona && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {selectedPersona ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarImage src={selectedPersona.foto_url || undefined} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {getInitials(getFullName(selectedPersona))}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm">{getFullName(selectedPersona)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Search className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm">Buscar por nombre o documento...</span>
                                                                </div>
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <div className="p-2">
                                                        <Input
                                                            placeholder="Buscar..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="h-9"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto">
                                                        {isSearching ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                                                Buscando...
                                                            </div>
                                                        ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                                                            <>
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    No se encontraron resultados
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                                                                    onClick={() => {
                                                                        setShowNewPersonDialog(true)
                                                                        setComboboxOpen(false)
                                                                    }}
                                                                >
                                                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-muted-foreground">Crear nueva persona</span>
                                                                </button>
                                                            </>
                                                        ) : searchResults.length === 0 ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                Escribe al menos 2 caracteres para buscar
                                                            </div>
                                                        ) : (
                                                            searchResults.map((persona) => (
                                                                <button
                                                                    key={persona.id}
                                                                    type="button"
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                                                                        field.value === persona.id && "bg-accent"
                                                                    )}
                                                                    onClick={() => {
                                                                        field.onChange(persona.id)
                                                                        setSelectedPersona(persona)
                                                                        setSearchQuery("")
                                                                        setComboboxOpen(false)
                                                                    }}
                                                                >
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={persona.foto_url || undefined} />
                                                                        <AvatarFallback className="text-xs font-semibold">
                                                                            {getInitials(getFullName(persona))}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col items-start gap-0.5">
                                                                        <span className="font-medium">{getFullName(persona)}</span>
                                                                        <span className="text-xs text-muted-foreground">{getDocument(persona)}</span>
                                                                    </div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />

                                {/* Relationship Select */}
                                <FormField
                                    control={form.control}
                                    name="relacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Parentesco
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20">
                                                        <SelectValue placeholder="Seleccionar parentesco" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="cónyuge">Cónyuge</SelectItem>
                                                    <SelectItem value="padre">Padre</SelectItem>
                                                    <SelectItem value="madre">Madre</SelectItem>
                                                    <SelectItem value="hijo/a">Hijo/a</SelectItem>
                                                    <SelectItem value="suegro">Suegro</SelectItem>
                                                    <SelectItem value="suegra">Suegra</SelectItem>
                                                    <SelectItem value="hermano/a">Hermano/a</SelectItem>
                                                    <SelectItem value="otro">Otro</SelectItem>
                                                    <SelectItem value="yerno">Yerno</SelectItem>
                                                    <SelectItem value="nuera">Nuera</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                        <SheetFooter className="sm:justify-end">
                            <Button
                                type="submit"
                                form="add-family-form"
                                className="w-full sm:w-auto h-11 font-bold tracking-tight text-sm shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Vinculando...
                                    </>
                                ) : (
                                    "Vincular Familiar"
                                )}
                            </Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Nested NewPersonDialog */}
            {showNewPersonDialog && (
                <NewPersonDialog
                    open={showNewPersonDialog}
                    onOpenChange={setShowNewPersonDialog}
                    onSuccess={(bp_id) => {
                        setCreatedPersonaId(bp_id)
                        setShowNewPersonDialog(false)
                    }}
                />
            )}
        </>
    )
}
