"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import { relationshipFormSchema, type RelationshipFormValues } from "@/lib/schemas/relationship-schema"

// MOCK DATA FOR SEARCH
const MOCK_ENTITIES = [
    { id: "101", name: "Juan Pérez", type: "persona", detail: "Socio Activo" },
    { id: "102", name: "Ana María Lopez", type: "persona", detail: "Beneficiaria" },
    { id: "103", name: "TechCorp S.A.S", type: "empresa", detail: "Proveedor TI" },
    { id: "104", name: "Club Campestre", type: "empresa", detail: "Alianza" },
    { id: "105", name: "Carlos Rodriguez", type: "persona", detail: "Ex-Socio" },
]

interface RelationshipFormSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RelationshipFormSheet({ open, onOpenChange }: RelationshipFormSheetProps) {
    const [isPending, setIsPending] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    const form = useForm<RelationshipFormValues>({
        resolver: zodResolver(relationshipFormSchema),
        defaultValues: {
            esta_activo: true,
            tipo_relacion: "familiar",
            entidad_destino_id: "",
            rol_destino: "",
            rol_origen: "",
        } as Partial<RelationshipFormValues>,
    })

    const tipo_relacion = form.watch("tipo_relacion")
    const fecha_inicio = form.watch("fecha_inicio")
    const esta_activo = form.watch("esta_activo")
    const selectedEntityId = form.watch("entidad_destino_id")

    const selectedEntity = MOCK_ENTITIES.find(e => e.id === selectedEntityId)

    // Dynamic Role Placeholders
    const getPlaceholders = () => {
        if (!selectedEntity) return { dest: "Rol relativo", orig: "Mi rol" }

        const name = selectedEntity.name.split(" ")[0]

        switch (tipo_relacion) {
            case "familiar":
                return {
                    dest: `¿Qué es ${name} para el socio? (ej: Padre)`,
                    orig: `¿Qué es el socio para ${name}? (ej: Hijo)`
                }
            case "laboral":
                return {
                    dest: `¿Qué rol tiene ${name}? (ej: Jefe Directo)`,
                    orig: `¿Qué rol tiene el socio? (ej: Analista)`
                }
            case "comercial":
                return {
                    dest: `Relación comercial (ej: Proveedor)`,
                    orig: `Relación (ej: Cliente)`
                }
            default:
                return { dest: "Rol relativo", orig: "Rol recíproco" }
        }
    }

    const placeholders = getPlaceholders()

    const onSubmit = async (data: RelationshipFormValues) => {
        setIsPending(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log("Form Submitted:", data)
        setIsPending(false)
        onOpenChange(false)
        form.reset({
            esta_activo: true,
            tipo_relacion: "familiar",
            entidad_destino_id: "",
            rol_destino: "",
            rol_origen: "",
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md md:max-w-lg w-full flex flex-col h-full bg-slate-50/50 p-0 gap-0">
                <SheetHeader className="px-6 py-4 bg-background border-b z-10">
                    <SheetTitle>Nueva Relación</SheetTitle>
                    <SheetDescription>
                        Vincula personas o empresas para construir la red del socio.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="py-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* 1. TIPO DE RELACIÓN */}
                                <FormField
                                    control={form.control}
                                    name="tipo_relacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Vínculo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="familiar">Familiar</SelectItem>
                                                    <SelectItem value="laboral">Laboral / Profesional</SelectItem>
                                                    <SelectItem value="comercial">Comercial / Negocios</SelectItem>
                                                    <SelectItem value="otra">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* 2. SEARCH ENTITY */}
                                <FormField
                                    control={form.control}
                                    name="entidad_destino_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Entidad a Vincular</FormLabel>
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
                                                                ? MOCK_ENTITIES.find((item) => item.id === field.value)?.name
                                                                : "Buscar persona o empresa..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar..." />
                                                        <CommandList>
                                                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                            <CommandGroup heading="Sugerencias">
                                                                {MOCK_ENTITIES.map((item) => (
                                                                    <CommandItem
                                                                        value={item.name}
                                                                        key={item.id}
                                                                        onSelect={() => {
                                                                            form.setValue("entidad_destino_id", item.id)
                                                                            setSearchOpen(false)
                                                                        }}
                                                                        className="flex flex-col items-start gap-0.5 py-2"
                                                                    >
                                                                        <div className="flex items-center gap-2 w-full">
                                                                            <span className="font-medium">{item.name}</span>
                                                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{item.type}</Badge>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">{item.detail}</p>

                                                                        {item.id === field.value && (
                                                                            <Check className="absolute right-2 top-3 h-4 w-4 text-primary" />
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {selectedEntity && (
                                    <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-muted-foreground/20 space-y-4 animate-in fade-in-50 slide-in-from-top-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="bg-background">Relación Bidireccional</Badge>
                                        </div>

                                        {/* 3A. ROL DESTINO */}
                                        <FormField
                                            control={form.control}
                                            name="rol_destino"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">{placeholders.dest}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={tipo_relacion === 'familiar' ? "Padre, Madre, Hermano..." : "Jefe, Empleado..."} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* 3B. ROL ORIGEN */}
                                        <FormField
                                            control={form.control}
                                            name="rol_origen"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">{placeholders.orig}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={tipo_relacion === 'familiar' ? "Hijo, Hermano..." : "Subordinado, Empleador..."} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <Separator />

                                {/* 4. METADATA DINÁMICA */}
                                {tipo_relacion === "laboral" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="metadata.cargo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cargo</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="metadata.departamento"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Departamento</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {tipo_relacion === "familiar" && (
                                    <div className="space-y-3">
                                        <FormField
                                            control={form.control}
                                            name="metadata.es_acudiente"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Es Acudiente</FormLabel>
                                                        <FormDescription>
                                                            Tiene potestad legal sobre el socio.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="metadata.es_emergencia"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Contacto Emergencia</FormLabel>
                                                        <FormDescription>
                                                            Llamar en caso de urgencia.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <Separator />

                                {/* 5. VIGENCIA Y FECHAS */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <FormField
                                            control={form.control}
                                            name="fecha_inicio"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Fecha Inicio</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-[180px] pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP", { locale: es })
                                                                    ) : (
                                                                        <span>Seleccionar fecha</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) =>
                                                                    date > new Date() || date < new Date("1900-01-01")
                                                                }
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="esta_activo"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2 space-y-0 mt-6">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal cursor-pointer text-foreground">
                                                        Actualmente vigente
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {!esta_activo && (
                                        <FormField
                                            control={form.control}
                                            name="fecha_fin"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col animate-in fade-in-50">
                                                    <FormLabel>Fecha Finalización</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-[180px] pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP", { locale: es })
                                                                    ) : (
                                                                        <span>Seleccionar fecha</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value || undefined}
                                                                onSelect={field.onChange}
                                                                disabled={(date) => {
                                                                    // Cannot end before start
                                                                    return !!fecha_inicio && date < fecha_inicio
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* FOOTER ACTIONS IN SCROLL AREA IS BAD UX, LEAVE SPACE OR MOVE OUT */}
                                <div className="h-12" />
                            </form>
                        </Form>
                    </div>
                </ScrollArea>

                <div className="p-6 border-t bg-background mt-auto">
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear relación
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
