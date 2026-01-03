"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { familyFormSchema, type FamilyFormValues } from "@/lib/schemas/family-schema"
import { NewPersonSheet } from "@/components/socios/personas/new-person-sheet"
import { usePersonSearch, useCreateRelationship, useBusinessPartnerMeta } from "@/hooks/use-family-module"
import { useParams } from "next/navigation"

interface AddFamilySheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddFamilySheet({ open, onOpenChange }: AddFamilySheetProps) {
    const params = useParams()
    // Assume we have the origin BP ID from params or context. 
    // Usually admin/socios/personas/[id] -> params.id
    const originBpId = params.id as string

    const [searchOpen, setSearchOpen] = useState(false)

    // Search State
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

    // Hooks
    const { data: searchResults, isLoading: isSearching } = usePersonSearch(debouncedSearchQuery)
    const { mutate: createRelationship, isPending: isCreating } = useCreateRelationship()
    const { data: bpMeta } = useBusinessPartnerMeta(originBpId)

    // Create Person Sheet State
    const [isCreatePersonOpen, setIsCreatePersonOpen] = useState(false)

    const form = useForm<FamilyFormValues>({
        resolver: zodResolver(familyFormSchema),
        defaultValues: {
            persona_id: "",
            relacion: "hijo_a",
        } as Partial<FamilyFormValues>,
    })

    // Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Helper to infer reverse role
    const inferReverseRole = (relation: string) => {
        switch (relation) {
            case "esposo_a": return "Cónyuge"; // Per requirement
            case "hijo_a": return "Padre/Madre"; // Per requirement
            case "padre_madre": return "Hijo/a";
            case "hermano_a": return "Hermano/a";
            case "nieto_a": return "Abuelo/a";
            case "abuelo_a": return "Nieto/a";
            default: return "Familiar"; // Fallback
        }
    }

    const mapRelationLabel = (key: string) => {
        const map: Record<string, string> = {
            "esposo_a": "Esposo/a",
            "hijo_a": "Hijo/a",
            "padre_madre": "Padre/Madre",
            "hermano_a": "Hermano/a",
            "nieto_a": "Nieto/a",
            "otro": "Otro"
        }
        return map[key] || "Familiar"
    }

    const onSubmit = async (data: FamilyFormValues) => {
        if (!originBpId) {
            console.error("Missing Origin BP ID")
            return
        }

        if (!bpMeta?.organizacion_id) {
            console.error("Missing Organization ID")
            return
        }

        const rolDestino = mapRelationLabel(data.relacion)
        const rolOrigen = inferReverseRole(data.relacion)

        createRelationship({
            organizacion_id: bpMeta.organizacion_id,
            bp_origen_id: originBpId,
            bp_destino_id: data.persona_id,
            tipo_relacion: 'familiar',
            rol_destino: rolDestino,
            rol_origen: rolOrigen
        }, {
            onSuccess: () => {
                onOpenChange(false)
                form.reset()
                setSearchQuery("")
            }
        })
    }

    // State to hold the name of a newly created person (since they won't be in search results yet)
    const [createdPersonName, setCreatedPersonName] = useState<string | null>(null)

    // ... (lines 80-149 unchanged) ...

    const handleCreateSuccess = (newPersonId: string, newPersonName: string) => {
        setIsCreatePersonOpen(false)
        setSearchOpen(false)

        // select the new person
        form.setValue("persona_id", newPersonId)
        setCreatedPersonName(newPersonName)
    }

    // Helper to get selected name or fallback
    const selectedPerson = (searchResults || []).find(p => p.id === form.getValues("persona_id"))

    // Display logic: 
    // 1. Exact match in search results
    // 2. Recently created person name
    // 3. Fallback text if ID exists but no name found
    const displaySelectedName = selectedPerson?.nombre_completo
        || createdPersonName
        || (form.getValues("persona_id") ? "Persona Seleccionada" : null)

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-md w-full flex flex-col h-full bg-background p-0 gap-0">
                    <div className="z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4">
                        <SheetHeader className="text-left">
                            <SheetTitle>Añadir Familiar</SheetTitle>
                            <SheetDescription>
                                Vincula un miembro de familia al grupo del socio.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* 1. BUSCADOR PERSONA */}
                                <FormField
                                    control={form.control}
                                    name="persona_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Buscar Persona</FormLabel>
                                            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? displaySelectedName
                                                                : "Buscar por nombre o documento..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <Command shouldFilter={false}>
                                                        <CommandInput
                                                            placeholder="Escribe para buscar..."
                                                            value={searchQuery}
                                                            onValueChange={setSearchQuery}
                                                        />
                                                        <CommandList>
                                                            {isSearching && (
                                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                                                                    Buscando...
                                                                </div>
                                                            )}

                                                            {!isSearching && (!searchResults || searchResults.length === 0) && searchQuery.length >= 2 && (
                                                                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                            )}

                                                            <CommandGroup heading="Resultados">
                                                                {(searchResults || []).map((item: any) => (
                                                                    <CommandItem
                                                                        value={item.id}
                                                                        key={item.id}
                                                                        onSelect={() => {
                                                                            form.setValue("persona_id", item.id)
                                                                            setSearchOpen(false)
                                                                        }}
                                                                        className="flex items-center gap-2 py-3 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                                    >
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage src={item.foto_url} />
                                                                            <AvatarFallback className="text-[10px]">
                                                                                {(item.nombre_completo || "").substring(0, 2).toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">{item.nombre_completo}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {item.tipo_documento} {item.numero_documento}
                                                                            </span>
                                                                        </div>
                                                                        {item.id === field.value && (
                                                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>

                                                            {!isSearching && searchQuery.length > 0 && (
                                                                <>
                                                                    <CommandSeparator />
                                                                    <CommandGroup>
                                                                        <CommandItem
                                                                            value="create-new-person"
                                                                            onSelect={() => {
                                                                                setIsCreatePersonOpen(true)
                                                                            }}
                                                                            className="flex items-center gap-2 py-3 text-primary cursor-pointer hover:bg-primary/5 data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                                        >
                                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                                                <UserPlus className="h-4 w-4" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">Crear nueva persona</span>
                                                                                <span className="text-xs text-muted-foreground">"{searchQuery}" no existe aún</span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    </CommandGroup>
                                                                </>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 2. PARENTESCO */}
                                <FormField
                                    control={form.control}
                                    name="relacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parentesco</FormLabel>
                                            <FormDescription className="text-xs">
                                                ¿Qué es esta persona para el socio?
                                            </FormDescription>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="esposo_a">Esposo/a</SelectItem>
                                                    <SelectItem value="hijo_a">Hijo/a</SelectItem>
                                                    <SelectItem value="padre_madre">Padre/Madre</SelectItem>
                                                    <SelectItem value="hermano_a">Hermano/a</SelectItem>
                                                    <SelectItem value="nieto_a">Nieto/a</SelectItem>
                                                    <SelectItem value="otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full mt-8"
                                        disabled={isCreating}
                                    >
                                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Familiar
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </SheetContent>
            </Sheet>

            {/* STACKED SHEET FOR CREATION */}
            <NewPersonSheet
                open={isCreatePersonOpen}
                onOpenChange={setIsCreatePersonOpen}
                onSuccess={handleCreateSuccess}
            />
        </>
    )
}
