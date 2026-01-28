"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

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
import { PhoneInput } from "@/components/ui/phone-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { crearPersonaFromPersonFormValues } from "@/app/actions/personas"
import { personSchema, type PersonFormValues } from "@/lib/schemas/person-schema"

interface NewPersonDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: (bp_id: string) => void
}

export function NewPersonDialog({ open: controlledOpen, onOpenChange, onSuccess }: NewPersonDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    // Use controlled open if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    // Filter function for name fields (letters including accents, ñ, spaces)
    const filterLettersOnly = (value: string) => {
        return value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/gu, '')
    }

    // Filter function for document number based on type
    const filterDocumentNumber = (value: string, tipoDoc: string) => {
        if (tipoDoc === "CC" || tipoDoc === "CE") {
            return value.replace(/\D/g, '') // Keep only digits
        }
        return value // Allow alphanumeric for other types
    }

    const form = useForm({
        resolver: zodResolver(personSchema),
        defaultValues: {
            primer_nombre: "",
            segundo_nombre: "",
            primer_apellido: "",
            segundo_apellido: "",
            tipo_documento: "CC",
            numero_documento: "",
            email_principal: "",
            telefono_principal: "",
            estado: "activo",
            genero: "",
            fecha_nacimiento: undefined,
            estado_vital: "vivo",
            tags: [],
        },
    })

    async function onSubmit(data: PersonFormValues) {
        console.log('[NewPersonDialog] Iniciando submit con datos:', data)
        setIsPending(true)
        try {
            const result = await crearPersonaFromPersonFormValues(data)
            console.log('[NewPersonDialog] Resultado del servidor:', result)

            if (result.success === false) {
                toast.error("Error al crear persona", {
                    description: result.message || "Error desconocido",
                })
                return
            }

            toast.success("Persona creada correctamente. Completa su perfil ahora.")

            form.reset()
            setOpen(false)

            // Call onSuccess callback if provided (for nested dialog usage)
            if (onSuccess && result.bp_id) {
                onSuccess(result.bp_id)
            }
            // Otherwise navigate to the newly created person detail page (default behavior)
            else if (result.bp_id) {
                router.push(`/admin/socios/personas/${result.bp_id}?tab=profile`)
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Only show trigger if not controlled (i.e., used as standalone) */}
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Persona
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
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Nueva Persona</DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground mt-1">
                                Ingresa los datos básicos para el alta. Podrás completar el perfil detallado después.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Form Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-8 py-8">
                        <Form {...form}>
                            <form id="new-person-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                                {/* SECCIÓN 1: IDENTIDAD */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">1</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Documento de Identidad</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <div className="grid grid-cols-10 gap-4">
                                        <div className="col-span-5">
                                            <FormField
                                                control={form.control}
                                                name="tipo_documento"
                                                render={({ field, fieldState }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Tipo</FormLabel>
                                                        <Select
                                                            onValueChange={(val) => {
                                                                field.onChange(val)
                                                                // Filter existing document number when type changes to CC/CE
                                                                // Or clear it when changing from CC/CE to other types
                                                                const currentDocNumber = form.getValues("numero_documento")

                                                                if ((val === "CC" || val === "CE") && currentDocNumber) {
                                                                    // Filter out non-numeric characters when switching TO CC/CE
                                                                    const filtered = filterDocumentNumber(currentDocNumber, val)
                                                                    if (filtered !== currentDocNumber) {
                                                                        form.setValue("numero_documento", filtered)
                                                                    }
                                                                }
                                                            }}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className={cn(
                                                                    "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                                                                    fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                                )}>
                                                                    <SelectValue placeholder="Tipo" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="CC">Cédula (CC)</SelectItem>
                                                                <SelectItem value="CE">Extranjería (CE)</SelectItem>
                                                                <SelectItem value="TI">T. Identidad (TI)</SelectItem>
                                                                <SelectItem value="PA">Pasaporte</SelectItem>
                                                                <SelectItem value="NIT">NIT</SelectItem>
                                                                <SelectItem value="PEP">PEP</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-5">
                                            <FormField
                                                control={form.control}
                                                name="numero_documento"
                                                render={({ field, fieldState }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Número de Documento</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                className={cn(
                                                                    "h-11 bg-muted/30 border-muted-foreground/20 font-mono tracking-widest focus-visible:ring-primary/20",
                                                                    fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                                )}
                                                                placeholder="123456789"
                                                                inputMode={form.watch("tipo_documento") === "CC" || form.watch("tipo_documento") === "CE" ? "numeric" : "text"}
                                                                {...field}
                                                                onInput={(e) => {
                                                                    const currentTipoDoc = form.getValues("tipo_documento")
                                                                    const filtered = filterDocumentNumber(e.currentTarget.value, currentTipoDoc)
                                                                    if (filtered !== e.currentTarget.value) {
                                                                        field.onChange(filtered)
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="fecha_nacimiento"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Fecha de Nacimiento</FormLabel>
                                                    <FormControl>
                                                        <DatePicker
                                                            value={field.value as any}
                                                            onChange={field.onChange}
                                                            placeholder="Seleccionar fecha"
                                                            captionLayout="dropdown"
                                                            fromYear={1900}
                                                            toYear={new Date().getFullYear()}
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
                                        <FormField
                                            control={form.control}
                                            name="genero"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Género</FormLabel>
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
                                                            <SelectItem value="masculino">Masculino</SelectItem>
                                                            <SelectItem value="femenino">Femenino</SelectItem>
                                                            <SelectItem value="otro">Otro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* SECCIÓN 2: NOMBRES */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">2</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Nombres y Apellidos</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="primer_nombre"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Primer Nombre</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                            )}
                                                            placeholder="Ej: Juan"
                                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]+"
                                                            inputMode="text"
                                                            {...field}
                                                            onInput={(e) => {
                                                                const filtered = filterLettersOnly(e.currentTarget.value)
                                                                if (filtered !== e.currentTarget.value) {
                                                                    field.onChange(filtered)
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="segundo_nombre"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Segundo Nombre</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                            )}
                                                            placeholder="(Opcional)"
                                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]+"
                                                            inputMode="text"
                                                            {...field}
                                                            onInput={(e) => {
                                                                const filtered = filterLettersOnly(e.currentTarget.value)
                                                                if (filtered !== e.currentTarget.value) {
                                                                    field.onChange(filtered)
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="primer_apellido"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Primer Apellido</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                            )}
                                                            placeholder="Ej: Pérez"
                                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]+"
                                                            inputMode="text"
                                                            {...field}
                                                            onInput={(e) => {
                                                                const filtered = filterLettersOnly(e.currentTarget.value)
                                                                if (filtered !== e.currentTarget.value) {
                                                                    field.onChange(filtered)
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="segundo_apellido"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Segundo Apellido</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                            )}
                                                            placeholder="(Opcional)"
                                                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]+"
                                                            inputMode="text"
                                                            {...field}
                                                            onInput={(e) => {
                                                                const filtered = filterLettersOnly(e.currentTarget.value)
                                                                if (filtered !== e.currentTarget.value) {
                                                                    field.onChange(filtered)
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* SECCIÓN 3: CONTACTO */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">3</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Datos de Contacto</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="email_principal"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Correo Electrónico</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                            )}
                                                            type="email"
                                                            placeholder="usuario@ejemplo.com"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex-1">
                                            <PhoneInput
                                                name="telefono_principal"
                                                label="Teléfono / WhatsApp"
                                                defaultCountry="CO"
                                                className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                        <Button
                            type="submit"
                            form="new-person-form"
                            className="w-full h-12 font-bold tracking-tight text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Procesando Alta...
                                </>
                            ) : (
                                "Crear Persona"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
