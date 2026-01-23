"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Search, X, Badge } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

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
import { DatePicker } from "@/components/ui/date-picker"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge as UIBadge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { crearTarea, buscarMiembrosOrganizacion, buscarDocumentosComerciales } from "@/app/actions/tareas"
import { tareaSchema, type TareaFormValues } from "@/lib/schemas/tarea-schema"

interface NewTareaSheetProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: (tarea_id: string) => void
    // Pre-fill values for contextual creation
    defaultValues?: Partial<TareaFormValues>
}

interface MiembroOrganizacion {
    user_id: string
    nombres: string
    apellidos: string
    email: string
    telefono?: string
    cargo?: string
    role?: string
}

interface DocumentoComercial {
    id: string
    codigo: string
    tipo: string
    estado: string
    titulo?: string
    fecha_doc: string
    solicitante_id?: string
}

export function NewTareaSheet({ open: controlledOpen, onOpenChange, onSuccess, defaultValues }: NewTareaSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const queryClient = useQueryClient()
    const supabase = createClient()

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    // Get current user for default asignado_a
    const { data: orgData } = useQuery({
        queryKey: ["organization-id-and-user"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user found")
            const { data } = await supabase
                .from("config_organizacion_miembros")
                .select("organization_id, user_id")
                .eq("user_id", user.id)
                .is("eliminado_en", null)
                .limit(1)
                .single()
            return {
                orgId: data?.organization_id || "",
                currentUserId: user.id
            }
        },
        enabled: open,
    })

    const orgId = orgData?.orgId
    const currentUserId = orgData?.currentUserId

    // Fetch existing tags from tareas
    useQuery({
        queryKey: ["existing-tags-tareas", orgId],
        queryFn: async () => {
            if (!orgId) return []
            const { data, error } = await supabase
                .from("tr_tareas")
                .select("tags")
                .eq("organizacion_id", orgId)
                .not("tags", "is", null)
                .not("tags", "eq", "{}")
            if (error) throw error
            const allTags = data?.flatMap(o => o.tags || []) || []
            const uniqueTags = Array.from(new Set(allTags))
            setExistingTags(uniqueTags)
            return uniqueTags
        },
        enabled: !!orgId,
    })

    // Miembro (asignado_a) search state
    const [miembroSearchQuery, setMiembroSearchQuery] = useState("")
    const [miembroComboboxOpen, setMiembroComboboxOpen] = useState(false)
    const [miembroSearchResults, setMiembroSearchResults] = useState<MiembroOrganizacion[]>([])
    const [isSearchingMiembros, setIsSearchingMiembros] = useState(false)
    const [selectedMiembro, setSelectedMiembro] = useState<MiembroOrganizacion | null>(null)

    // Documento (oportunidad_id) search state
    const [documentoSearchQuery, setDocumentoSearchQuery] = useState("")
    const [documentoComboboxOpen, setDocumentoComboboxOpen] = useState(false)
    const [documentoSearchResults, setDocumentoSearchResults] = useState<DocumentoComercial[]>([])
    const [isSearchingDocumentos, setIsSearchingDocumentos] = useState(false)
    const [selectedDocumento, setSelectedDocumento] = useState<DocumentoComercial | null>(null)

    // Tags state
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [existingTags, setExistingTags] = useState<string[]>([])

    const form = useForm<TareaFormValues>({
        resolver: zodResolver(tareaSchema),
        defaultValues: {
            titulo: "",
            descripcion: "",
            prioridad: "Media",
            estado: "Pendiente",
            fecha_vencimiento: undefined,
            asignado_a: undefined,
            relacionado_con_bp: undefined,
            oportunidad_id: undefined,
            tags: [],
            ...defaultValues,
        },
    })

    // Set current user as default responsable
    useEffect(() => {
        if (currentUserId && !form.getValues("asignado_a")) {
            form.setValue("asignado_a", currentUserId)
        }
    }, [currentUserId, form])

    // Debounced search for miembros
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (miembroSearchQuery.length >= 2 && orgId) {
                setIsSearchingMiembros(true)
                const result = await buscarMiembrosOrganizacion(miembroSearchQuery, orgId)
                setMiembroSearchResults(result.success ? result.data : [])
                setIsSearchingMiembros(false)
            } else {
                setMiembroSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [miembroSearchQuery, orgId])

    // Debounced search for documentos
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (documentoSearchQuery.length >= 2 && orgId) {
                setIsSearchingDocumentos(true)
                const result = await buscarDocumentosComerciales(documentoSearchQuery, orgId)
                setDocumentoSearchResults(result.success ? result.data : [])
                setIsSearchingDocumentos(false)
            } else {
                setDocumentoSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [documentoSearchQuery, orgId])

    // Sync selectedMiembro with form value
    const asignadoId = form.watch("asignado_a")
    useEffect(() => {
        if (asignadoId && !selectedMiembro) {
            const found = miembroSearchResults.find(m => m.user_id === asignadoId)
            if (found) setSelectedMiembro(found)
        } else if (!asignadoId && selectedMiembro) {
            setSelectedMiembro(null)
        }
    }, [asignadoId, miembroSearchResults, selectedMiembro])

    // Sync selectedDocumento with form value
    const docId = form.watch("oportunidad_id")
    useEffect(() => {
        if (docId && !selectedDocumento) {
            const found = documentoSearchResults.find(d => d.id === docId)
            if (found) setSelectedDocumento(found)
        } else if (!docId && selectedDocumento) {
            setSelectedDocumento(null)
        }
    }, [docId, documentoSearchResults, selectedDocumento])

    // Reset state when sheet is closed
    useEffect(() => {
        if (!open) {
            setSelectedMiembro(null)
            setMiembroSearchQuery("")
            setMiembroSearchResults([])
            setSelectedDocumento(null)
            setDocumentoSearchQuery("")
            setDocumentoSearchResults([])
            setTags([])
            setTagInput("")
            form.reset()
            if (currentUserId) {
                form.setValue("asignado_a", currentUserId)
            }
        }
    }, [open, form, currentUserId])

    // Helper functions
    function getInitials(nombre: string) {
        return nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    function getDocumentoDisplay(doc: DocumentoComercial) {
        return `${doc.codigo}${doc.titulo ? ` - ${doc.titulo}` : ""} (${doc.tipo})`
    }

    function addTag(tag: string) {
        const trimmedTag = tag.trim().toLowerCase()
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag])
        }
        setTagInput("")
    }

    function removeTag(tagToRemove: string) {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            if (tagInput.trim()) {
                addTag(tagInput)
            }
        }
    }

    async function onSubmit(data: TareaFormValues) {
        setIsPending(true)
        try {
            const result = await crearTarea({
                titulo: data.titulo,
                descripcion: data.descripcion || undefined,
                prioridad: (data.prioridad?.toLowerCase() as 'baja' | 'media' | 'alta' | 'critica') || 'media',
                oportunidad_id: data.oportunidad_id || undefined,
                asignado_a: data.asignado_a || undefined,
                relacionado_con_bp: data.relacionado_con_bp || undefined,
                fecha_vencimiento: data.fecha_vencimiento
                    ? data.fecha_vencimiento.toISOString().split('T')[0]
                    : undefined,
                tags: tags.length > 0 ? tags : undefined,
            })

            if (!result.success) {
                toast.error("Error al crear tarea", {
                    description: result.message,
                })
                return
            }

            toast.success("Tarea creada correctamente")

            // Invalidate and refetch
            await queryClient.invalidateQueries({ queryKey: ["tareas"] })

            form.reset()
            setOpen(false)

            if (onSuccess && result.tarea_id) {
                onSuccess(result.tarea_id)
            }
        } catch (err) {
            console.error("Error creating tarea:", err)
            toast.error("Error inesperado al crear la tarea")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {controlledOpen === undefined && (
                <SheetTrigger asChild>
                    <Button size="sm" className="h-8 shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Tarea
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
                {/* Header */}
                <div className="bg-background shrink-0 px-6 py-6 border-b">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                            Nueva Tarea
                        </SheetTitle>
                        <SheetDescription className="text-base text-muted-foreground mt-1">
                            Crea una nueva tarea para dar seguimiento.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <Form {...form}>
                        <form id="new-tarea-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-primary font-bold text-sm">1</span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Información Básica
                                    </h3>
                                    <Separator className="flex-1" />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="titulo"
                                    render={({ field, fieldState }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Título *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={cn(
                                                        "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                        fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                    )}
                                                    placeholder="Ej: Llamar al cliente para confirmar cita"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="descripcion"
                                    render={({ field, fieldState }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Descripción
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    className={cn(
                                                        "min-h-[100px] bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                        fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                    )}
                                                    placeholder="Detalles adicionales de la tarea..."
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* SECCIÓN 2: CLASIFICACIÓN */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-primary font-bold text-sm">2</span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Clasificación
                                    </h3>
                                    <Separator className="flex-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="prioridad"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                    Prioridad
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className={cn(
                                                            "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                                                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                        )}>
                                                            <SelectValue placeholder="Seleccionar..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Baja">Baja</SelectItem>
                                                        <SelectItem value="Media">Media</SelectItem>
                                                        <SelectItem value="Alta">Alta</SelectItem>
                                                        <SelectItem value="Urgente">Urgente</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="estado"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                    Estado
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className={cn(
                                                            "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                                                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                        )}>
                                                            <SelectValue placeholder="Seleccionar..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                        <SelectItem value="En Progreso">En Progreso</SelectItem>
                                                        <SelectItem value="Pausada">Pausada</SelectItem>
                                                        <SelectItem value="Terminada">Terminada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="fecha_vencimiento"
                                    render={({ field, fieldState }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Fecha de Vencimiento
                                            </FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value as Date | null | undefined}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar fecha"
                                                    fromYear={new Date().getFullYear()}
                                                    toYear={new Date().getFullYear() + 5}
                                                    className={cn(
                                                        "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                                                        fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                    )}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* SECCIÓN 3: ASIGNACIÓN Y VINCULACIÓN */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-primary font-bold text-sm">3</span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Asignación y Vinculación
                                    </h3>
                                    <Separator className="flex-1" />
                                </div>

                                {/* Responsable (asignado_a) Combobox */}
                                <FormField
                                    control={form.control}
                                    name="asignado_a"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col gap-2">
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Responsable <span className="font-normal text-muted-foreground/60">(predeterminado: tú)</span>
                                            </FormLabel>
                                            <Popover open={miembroComboboxOpen} onOpenChange={setMiembroComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            type="button"
                                                            className={cn(
                                                                "w-full justify-between h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                !selectedMiembro && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {selectedMiembro ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {getInitials(selectedMiembro.nombres || selectedMiembro.email || "U")}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="text-sm font-medium">{selectedMiembro.nombres} {selectedMiembro.apellidos}</span>
                                                                        <span className="text-xs text-muted-foreground">{selectedMiembro.email}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Search className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm">Buscar miembro...</span>
                                                                </div>
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0" align="start">
                                                    <div className="p-2">
                                                        <Input
                                                            placeholder="Escribe al menos 2 caracteres..."
                                                            value={miembroSearchQuery}
                                                            onChange={(e) => setMiembroSearchQuery(e.target.value)}
                                                            className="h-9"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto">
                                                        {isSearchingMiembros ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                                                Buscando...
                                                            </div>
                                                        ) : miembroSearchResults.length === 0 && miembroSearchQuery.length >= 2 ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                No se encontraron resultados
                                                            </div>
                                                        ) : miembroSearchResults.length === 0 ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                Escribe al menos 2 caracteres para buscar
                                                            </div>
                                                        ) : (
                                                            miembroSearchResults.map((miembro) => (
                                                                <button
                                                                    key={miembro.user_id}
                                                                    type="button"
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                                                                        field.value === miembro.user_id && "bg-accent"
                                                                    )}
                                                                    onClick={() => {
                                                                        field.onChange(miembro.user_id)
                                                                        setSelectedMiembro(miembro)
                                                                        setMiembroSearchQuery("")
                                                                        setMiembroComboboxOpen(false)
                                                                    }}
                                                                >
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback className="text-xs font-semibold">
                                                                            {getInitials(miembro.nombres || miembro.email || "U")}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col items-start gap-0.5">
                                                                        <span className="font-medium">{miembro.nombres} {miembro.apellidos}</span>
                                                                        <span className="text-xs text-muted-foreground">{miembro.email}</span>
                                                                        {miembro.role && (
                                                                            <UIBadge variant="outline" className="text-[10px] mt-0.5">
                                                                                {miembro.role}
                                                                            </UIBadge>
                                                                        )}
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

                                {/* Documento asociado (oportunidad_id) Combobox */}
                                <FormField
                                    control={form.control}
                                    name="oportunidad_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col gap-2">
                                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                Documento asociado
                                            </FormLabel>
                                            <Popover open={documentoComboboxOpen} onOpenChange={setDocumentoComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            type="button"
                                                            className={cn(
                                                                "w-full justify-between h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                !selectedDocumento && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {selectedDocumento ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm">{getDocumentoDisplay(selectedDocumento)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Search className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm">Buscar documento...</span>
                                                                </div>
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0" align="start">
                                                    <div className="p-2">
                                                        <Input
                                                            placeholder="Escribe al menos 2 caracteres..."
                                                            value={documentoSearchQuery}
                                                            onChange={(e) => setDocumentoSearchQuery(e.target.value)}
                                                            className="h-9"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto">
                                                        {isSearchingDocumentos ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                                                Buscando...
                                                            </div>
                                                        ) : documentoSearchResults.length === 0 && documentoSearchQuery.length >= 2 ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                No se encontraron resultados
                                                            </div>
                                                        ) : documentoSearchResults.length === 0 ? (
                                                            <div className="py-4 text-center text-sm text-muted-foreground">
                                                                Escribe al menos 2 caracteres para buscar
                                                            </div>
                                                        ) : (
                                                            documentoSearchResults.map((doc) => (
                                                                <button
                                                                    key={doc.id}
                                                                    type="button"
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                                                                        field.value === doc.id && "bg-accent"
                                                                    )}
                                                                    onClick={() => {
                                                                        field.onChange(doc.id)
                                                                        setSelectedDocumento(doc)
                                                                        setDocumentoSearchQuery("")
                                                                        setDocumentoComboboxOpen(false)
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col items-start gap-0.5">
                                                                        <span className="font-medium">{doc.codigo}</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {doc.titulo || doc.tipo} • {doc.estado}
                                                                        </span>
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
                            </div>

                            {/* SECCIÓN 4: ETIQUETAS */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-primary font-bold text-sm">4</span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Etiquetas
                                    </h3>
                                    <Separator className="flex-1" />
                                </div>

                                {/* Tags Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                        Etiquetas <span className="font-normal text-muted-foreground/60">(opcional)</span>
                                    </label>
                                    <div className="space-y-2">
                                        {/* Selected Tags */}
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map((tag) => (
                                                    <UIBadge key={tag} variant="secondary" className="gap-1 pr-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTag(tag)}
                                                            className="ml-1 rounded-full hover:bg-background/20 p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </UIBadge>
                                                ))}
                                            </div>
                                        )}
                                        {/* Tag Input */}
                                        <div className="relative">
                                            <Input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagInputKeyDown}
                                                placeholder={
                                                    existingTags.length > 0
                                                        ? `Escribe y presiona Enter. Ej: ${existingTags.slice(0, 3).join(", ")}`
                                                        : "Escribe y presiona Enter para añadir etiquetas..."
                                                }
                                                className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                            />
                                            {/* Tag Suggestions */}
                                            {tagInput && existingTags.filter(t => t.includes(tagInput.toLowerCase())).length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                                                    {existingTags
                                                        .filter(t => t.includes(tagInput.toLowerCase()) && !tags.includes(t))
                                                        .slice(0, 5)
                                                        .map((suggestedTag) => (
                                                            <button
                                                                key={suggestedTag}
                                                                type="button"
                                                                onClick={() => addTag(suggestedTag)}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                                            >
                                                                {suggestedTag}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </form>
                    </Form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                    <SheetFooter className="sm:justify-start">
                        <Button
                            type="submit"
                            form="new-tarea-form"
                            className="w-full h-12 font-bold tracking-tight text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                "Crear Tarea"
                            )}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
