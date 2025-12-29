"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDown, Loader2, Plus } from "lucide-react"
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
import { Separator } from "@/components/ui/separator"

import { crearPersonaFromPersonFormValues } from "@/app/actions/personas"
import { personSchema } from "@/lib/schemas/person-schema"

export function NewPersonSheet() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

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
            genero: "no_especifica",
            fecha_nacimiento: "",
            estado_vital: "vivo",
            tags: [],
        },
    })

    async function onSubmit(data: any) {
        setIsPending(true)
        try {
            const result = await crearPersonaFromPersonFormValues(data)

            if (result.success === false) {
                toast.error("Error al crear persona", {
                    description: result.message || "Error desconocido",
                })
                return
            }

            toast.success("Persona creada correctamente. Completa su perfil ahora.")

            form.reset()
            setOpen(false)

            // Navigate to the newly created person detail page
            if (result.bp_id) {
                router.push(`/admin/socios/personas/${result.bp_id}`)
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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Persona
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
                {/* Header Section */}
                <div className="bg-background shrink-0 px-6 py-6 border-b">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">Nueva Persona</SheetTitle>
                        <SheetDescription className="text-base text-muted-foreground mt-1">
                            Ingresa los datos básicos para el alta. Podrás completar el perfil detallado después.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
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
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Tipo</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20">
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
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Número de Documento</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className="h-11 bg-muted/30 border-muted-foreground/20 font-mono tracking-widest focus-visible:ring-primary/20"
                                                            placeholder="123456789"
                                                            {...field}
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
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Fecha de Nacimiento</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20 w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(new Date(field.value + "T12:00:00"), "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccionar fecha</span>
                                                                )}
                                                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            captionLayout="dropdown-buttons"
                                                            fromYear={1900}
                                                            toYear={new Date().getFullYear()}
                                                            selected={field.value ? new Date(field.value + "T12:00:00") : undefined}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    field.onChange(format(date, "yyyy-MM-dd"))
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="genero"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Género</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20">
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="masculino">Masculino</SelectItem>
                                                        <SelectItem value="femenino">Femenino</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                        <SelectItem value="no_especifica">No especifica</SelectItem>
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
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Primer Nombre</FormLabel>
                                                <FormControl>
                                                    <Input className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20" placeholder="Ej: Juan" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="segundo_nombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Segundo Nombre</FormLabel>
                                                <FormControl>
                                                    <Input className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20" placeholder="(Opcional)" {...field} />
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
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Primer Apellido</FormLabel>
                                                <FormControl>
                                                    <Input className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20" placeholder="Ej: Pérez" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="segundo_apellido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Segundo Apellido</FormLabel>
                                                <FormControl>
                                                    <Input className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20" placeholder="(Opcional)" {...field} />
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
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Correo Electrónico</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                                        type="email"
                                                        placeholder="usuario@ejemplo.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="telefono_principal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Teléfono / WhatsApp</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                                        placeholder="+57 3..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Footer Section */}
                <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                    <SheetFooter className="sm:justify-start">
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
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
