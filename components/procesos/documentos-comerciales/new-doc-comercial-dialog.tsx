"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Search, Building2, User, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogClose,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { crearDocComercial, buscarActores } from "@/app/actions/doc-comerciales"
import { docComercialSchema, type DocComercialFormValues } from "@/lib/schemas/doc-comercial-schema"

interface NewDocComercialDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: (doc_comercial_id: string) => void
}

interface ActorSearchResult {
    id: string
    nombre: string
    codigo: string
    tipo_actor: 'persona' | 'empresa'
    [key: string]: unknown
}

export function NewDocComercialDialog({ open: controlledOpen, onOpenChange, onSuccess }: NewDocComercialDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Search states for solicitante
    const [solicitanteSearchQuery, setSolicitanteSearchQuery] = useState("")
    const [solicitanteComboboxOpen, setSolicitanteComboboxOpen] = useState(false)
    const [solicitanteSearchResults, setSolicitanteSearchResults] = useState<ActorSearchResult[]>([])
    const [isSearchingSolicitante, setIsSearchingSolicitante] = useState(false)
    const [selectedSolicitante, setSelectedSolicitante] = useState<ActorSearchResult | null>(null)

    // Tags state
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [existingTags, setExistingTags] = useState<string[]>([])

    // Use controlled open if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    // Fetch organization ID and current user
    const { data: orgData } = useQuery({
        queryKey: ["organization-id-and-user"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user found")
            // Get organization from user metadata or user organization relationship
            const { data } = await supabase
                .from("config_organizacion_miembros")
                .select("organization_id")
                .eq("user_id", user.id)
                .is("eliminado_en", null)
                .single()
            return {
                orgId: data?.organization_id || "",
                currentUserId: user.id
            }
        },
    })

    const orgId = orgData?.orgId
    const currentUserId = orgData?.currentUserId

    // Fetch existing tags from documentos comerciales
    useQuery({
        queryKey: ["existing-tags", orgId],
        queryFn: async () => {
            if (!orgId) return []
            const { data, error } = await supabase
                .from("tr_doc_comercial")
                .select("tags")
                .eq("organizacion_id", orgId)
                .not("tags", "is", null)

            if (error) throw error

            // Extract all unique tags
            const allTags = data?.flatMap(o => o.tags || []) || []
            const uniqueTags = Array.from(new Set(allTags))
            setExistingTags(uniqueTags)
            return uniqueTags
        },
        enabled: !!orgId,
    })

    // Fetch users for responsable dropdown
    const { data: users, isLoading: loadingUsers } = useQuery({
        queryKey: ["auth-users"],
        queryFn: async () => {
            // Get users from user_profiles which should be accessible
            const { data, error } = await supabase
                .from("user_profiles")
                .select("id, email, first_name, last_name")
                .order("email")

            if (error) throw error
            return data || []
        },
    })

    const form = useForm<DocComercialFormValues>({
        resolver: zodResolver(docComercialSchema),
        defaultValues: {
            codigo: "", // Will be generated server-side
            tipo: "Solicitud Ingreso",
            solicitante_id: "",
            responsable_id: currentUserId || "",
            monto_estimado: 0,
            notas: "",
            atributos: {},
        },
    })

    // Set current user as default responsable when data loads
    useEffect(() => {
        if (currentUserId && !form.getValues("responsable_id")) {
            form.setValue("responsable_id", currentUserId)
        }
    }, [currentUserId, form])

    // Debounced search for solicitante
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (solicitanteSearchQuery.length >= 2 && orgId) {
                setIsSearchingSolicitante(true)
                const result = await buscarActores(solicitanteSearchQuery, orgId)
                setSolicitanteSearchResults(result.success ? result.data : [])
                setIsSearchingSolicitante(false)
            } else {
                setSolicitanteSearchResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [solicitanteSearchQuery, orgId])

    // Reset state when dialog is closed
    useEffect(() => {
        if (!open) {
            setSelectedSolicitante(null)
            setSolicitanteSearchQuery("")
            setSolicitanteSearchResults([])
            setTags([])
            setTagInput("")
            form.reset()
            if (currentUserId) {
                form.setValue("responsable_id", currentUserId)
            }
        }
    }, [open, form, currentUserId])

    // Sync selectedSolicitante with form value
    useEffect(() => {
        const solicitanteId = form.watch("solicitante_id")
        if (solicitanteId && !selectedSolicitante) {
            const found = solicitanteSearchResults.find(a => a.id === solicitanteId)
            if (found) {
                setSelectedSolicitante(found)
            }
        } else if (!solicitanteId && selectedSolicitante) {
            setSelectedSolicitante(null)
        }
    }, [form.watch("solicitante_id"), solicitanteSearchResults])

    async function onSubmit(data: DocComercialFormValues) {
        if (!orgId) {
            toast.error("Error: No se pudo identificar la organización")
            return
        }

        setIsPending(true)
        try {
            // Generate codigo server-side
            // TODO: Ensure gen_codigo_doc_comercial exists in Supabase
            const { data: generatedCodigo } = await supabase.rpc("gen_codigo_doc_comercial", {
                p_organizacion_id: orgId
            })

            if (!generatedCodigo) {
                toast.error("Error: No se pudo generar el código del documento")
                return
            }

            const result = await crearDocComercial({
                organizacion_id: orgId,
                codigo: generatedCodigo as string,
                tipo: data.tipo,
                solicitante_id: data.solicitante_id,
                responsable_id: data.responsable_id || undefined,
                monto_estimado: data.monto_estimado || undefined,
                notas: data.notas || undefined,
                atributos: data.atributos,
                tags: tags.length > 0 ? tags : undefined,
            })

            if (result.success === false) {
                toast.error("Error al crear documento comercial", {
                    description: result.message || "Error desconocido",
                })
                return
            }

            toast.success("Documento comercial creado correctamente")

            form.reset()
            setOpen(false)

            // Call onSuccess callback if provided (for nested dialog usage)
            if (onSuccess && result.doc_comercial_id) {
                onSuccess(result.doc_comercial_id)
            }
            // Otherwise navigate to the newly created detail page (default behavior)
            else if (result.doc_comercial_id) {
                router.push(`/admin/procesos/documentos-comerciales/${result.doc_comercial_id}`)
            } else {
                router.refresh()
            }
        } catch (err) {
            console.error("Unexpected error submitting form:", err)
            toast.error("Error inesperado al procesar la solicitud")
        } finally {
            setIsPending(false)
        }
    }

    // Get display name for actor from unified view
    const getActorDisplayName = (actor: ActorSearchResult) => {
        const type = actor.tipo_actor === "empresa" ? "[Empresa]" : "[Persona]"
        const name = actor.nombre || actor.codigo
        return `${actor.codigo} - ${name} ${type}`
    }

    function getInitials(nombre: string) {
        return nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Only show trigger if not controlled (i.e., used as standalone) */}
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Doc. Comercial
                    </Button>
                </DialogTrigger>
            )}
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm bg-background/40" />
                <DialogContent className="max-w-xl h-[85vh] border border-border/50 shadow-2xl rounded-xl overflow-hidden p-0 flex flex-col [&>button:last-child]:hidden">
                    {/* Custom close button in top-right */}
                    <div className="absolute top-6 right-6 z-10">
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Header Section */}
                    <div className="bg-background shrink-0 px-8 py-6 border-b">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Nuevo Doc. Comercial</DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground mt-1">
                                Crea un nuevo documento comercial en el sistema.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Form Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-8 py-8">
                        <Form {...form}>
                            <form id="new-doc-comercial-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                                {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">1</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Información Básica</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="tipo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Tipo de Documento</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20">
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Solicitud Ingreso">Solicitud Ingreso</SelectItem>
                                                        <SelectItem value="Solicitud Retiro">Solicitud Retiro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* SECCIÓN 2: ASIGNACIÓN */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">2</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Asignación</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="solicitante_id"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col gap-2">
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                    Solicitante
                                                </FormLabel>
                                                <Popover open={solicitanteComboboxOpen} onOpenChange={setSolicitanteComboboxOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                    !selectedSolicitante && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {selectedSolicitante ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarFallback className="text-[10px]">
                                                                                {selectedSolicitante.tipo_actor === "empresa" ? (
                                                                                    <Building2 className="h-3 w-3" />
                                                                                ) : (
                                                                                    <User className="h-3 w-3" />
                                                                                )}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-sm">{getActorDisplayName(selectedSolicitante)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <Search className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-sm">Buscar por código o nombre...</span>
                                                                    </div>
                                                                )}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[320px] p-0" align="start">
                                                        <div className="p-2">
                                                            <Input
                                                                placeholder="Escribe al menos 2 caracteres..."
                                                                value={solicitanteSearchQuery}
                                                                onChange={(e) => setSolicitanteSearchQuery(e.target.value)}
                                                                className="h-9"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-[200px] overflow-y-auto">
                                                            {isSearchingSolicitante ? (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                                                    Buscando...
                                                                </div>
                                                            ) : solicitanteSearchResults.length === 0 && solicitanteSearchQuery.length >= 2 ? (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    No se encontraron resultados
                                                                </div>
                                                            ) : solicitanteSearchResults.length === 0 ? (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    Escribe al menos 2 caracteres para buscar
                                                                </div>
                                                            ) : (
                                                                solicitanteSearchResults.map((actor) => (
                                                                    <button
                                                                        key={actor.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                                                                            field.value === actor.id && "bg-accent"
                                                                        )}
                                                                        onClick={() => {
                                                                            field.onChange(actor.id)
                                                                            setSelectedSolicitante(actor)
                                                                            setSolicitanteSearchQuery("")
                                                                            setSolicitanteComboboxOpen(false)
                                                                        }}
                                                                    >
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback className="text-xs font-semibold">
                                                                                {actor.tipo_actor === "empresa" ? (
                                                                                    <Building2 className="h-4 w-4" />
                                                                                ) : (
                                                                                    <User className="h-4 w-4" />
                                                                                )}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col items-start gap-0.5">
                                                                            <span className="font-medium">{actor.nombre}</span>
                                                                            <span className="text-xs text-muted-foreground">{actor.codigo}</span>
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

                                    <FormField
                                        control={form.control}
                                        name="responsable_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                    Responsable <span className="font-normal text-muted-foreground/60">(opcional)</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20">
                                                            {loadingUsers ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    <span className="text-muted-foreground text-sm">Cargando...</span>
                                                                </div>
                                                            ) : (
                                                                <SelectValue placeholder="Seleccione un responsable..." />
                                                            )}
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {users?.map((user) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-5 w-5">
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {getInitials(user.email || "U")}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{user.email}</span>
                                                                    {user.id === currentUserId && (
                                                                        <Badge variant="outline" className="ml-auto text-[10px]">Tú</Badge>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* SECCIÓN 3: DETALLES ADICIONALES */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">3</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Detalles Adicionales</h3>
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
                                                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTag(tag)}
                                                                className="ml-1 rounded-full hover:bg-background/20 p-0.5"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
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

                                    <FormField
                                        control={form.control}
                                        name="notas"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Notas <span className="font-normal text-muted-foreground/60">(opcional)</span></FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20 min-h-[180px] resize-y"
                                                        placeholder="Añade notas adicionales sobre este documento..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                        <Button
                            type="submit"
                            form="new-doc-comercial-form"
                            className="w-full h-12 font-bold tracking-tight text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                            disabled={isPending || !orgId}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creando Documento Comercial...
                                </>
                            ) : (
                                "Crear Documento Comercial"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
