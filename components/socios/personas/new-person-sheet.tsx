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
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
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
import { Separator } from "@/components/ui/separator"

import { crearPersonaFromPersonFormValues } from "@/app/actions/personas"
import { personSchema, type PersonFormValues } from "@/lib/schemas/person-schema"

export function NewPersonSheet() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(personSchema),
        defaultValues: {
            primer_nombre: "",
            segundo_nombre: "",
            primer_apellido: "",
            segundo_apellido: "",
            tipo_documento: "CC",
            numero_documento: "",
            genero: "masculino",
            fecha_nacimiento: "",
            fecha_expedicion: "",
            lugar_expedicion: "",
            lugar_nacimiento: "",
            nacionalidad: "CO",
            estado_civil: "soltero",
            estado_vital: "vivo",
            ocupacion: "",
            profesion: "",
            nivel_educacion: "",
            tipo_sangre: "",
            eps: "",
            fecha_socio: "",
            fecha_aniversario: "",
            email_principal: "",
            telefono_principal: "",
            email_secundario: "",
            telefono_secundario: "",
            whatsapp: "",
            linkedin_url: "",
            facebook_url: "",
            instagram_handle: "",
            twitter_handle: "",
            contacto_emergencia_id: "",
            relacion_emergencia: "",
            tags: [] as string[],
            estado: "activo",
        },
    })

    const router = useRouter()

    async function onSubmit(data: PersonFormValues) {
        setIsPending(true)
        console.log("Submitting person data:", data)
        try {
            const result = await crearPersonaFromPersonFormValues(data)
            console.log("Create person result:", result)

            if (result.success === false) {
                toast.error("Error al crear persona", {
                    description: result.message || "Error desconocido",
                })
                return
            }

            // The RPC returns { success, bp_id, codigo_bp, message, warnings }
            toast.success(result.message || "Persona creada exitosamente")
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach((warning: string) => toast.warning(warning))
            }

            form.reset()
            setOpen(false)
            router.refresh()
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
            <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0 gap-0">
                {/* Custom Overlay Effect applied in global styles usually, but SheetContent has defaults. 
             Prompt requested 'backdrop-blur-md overlay' which is on the overlay part. 
             Shadcn's SheetOverlay usually handles this class. I'll rely on default/config.
         */}

                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4">
                    <SheetHeader className="text-left">
                        <SheetTitle>Nueva Persona</SheetTitle>
                        <SheetDescription>
                            Ingrese los datos personales y de contacto. El código de socio se generará automáticamente.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="px-6 py-6 pb-24">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Relational / System Info */}
                            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                                <h3 className="font-medium text-sm text-foreground">Información del Sistema</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-xs font-medium text-muted-foreground">Código BP</span>
                                        <div className="font-mono text-sm">Autogenerado</div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-medium text-muted-foreground">Tipo de Actor</span>
                                        <div className="text-sm font-medium">Persona Natural</div>
                                    </div>
                                </div>
                            </div>

                            {/* Identity Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Identidad y Nombres
                                    <Separator className="flex-1" />
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primer_nombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primer Nombre <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Juan" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="segundo_nombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Segundo Nombre</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primer_apellido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primer Apellido <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Pérez" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="segundo_apellido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Segundo Apellido</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tipo_documento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo Documento <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CC">Cédula Ciudadanía</SelectItem>
                                                        <SelectItem value="CE">Cédula Extranjería</SelectItem>
                                                        <SelectItem value="TI">Tarjeta Identidad</SelectItem>
                                                        <SelectItem value="PA">Pasaporte</SelectItem>
                                                        <SelectItem value="RC">Registro Civil</SelectItem>
                                                        <SelectItem value="NIT">NIT</SelectItem>
                                                        <SelectItem value="PEP">PEP</SelectItem>
                                                        <SelectItem value="PPT">PPT</SelectItem>
                                                        <SelectItem value="DNI">Cédula de Identidad (DNI)</SelectItem>
                                                        <SelectItem value="NUIP">NUIP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="numero_documento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número Documento <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input className="font-mono" placeholder="123456789" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fecha_expedicion"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha Expedición</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(new Date(field.value + "T00:00:00"), "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccione una fecha</span>
                                                                )}
                                                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                            locale={es}
                                                            captionLayout="dropdown"
                                                            fromYear={1900}
                                                            toYear={new Date().getFullYear()}
                                                            classNames={{
                                                                caption_dropdowns: "flex justify-center gap-1",
                                                                caption_label: "hidden",
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lugar_expedicion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lugar Expedición</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Bogotá" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Demographic Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Información Demográfica
                                    <Separator className="flex-1" />
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fecha_nacimiento"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha Nacimiento <span className="text-destructive">*</span></FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(new Date(field.value + "T00:00:00"), "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccione una fecha</span>
                                                                )}
                                                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                            locale={es}
                                                            captionLayout="dropdown"
                                                            fromYear={1900}
                                                            toYear={new Date().getFullYear()}
                                                            classNames={{
                                                                caption_dropdowns: "flex justify-center gap-1",
                                                                caption_label: "hidden",
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="genero"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Género <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="masculino">Masculino</SelectItem>
                                                        <SelectItem value="femenino">Femenino</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                        <SelectItem value="no_especifica">No especifica</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="lugar_nacimiento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lugar de Nacimiento</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Medellín" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nacionalidad"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nacionalidad</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="CO" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="estado_civil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado Civil</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="soltero">Soltero/a</SelectItem>
                                                        <SelectItem value="casado">Casado/a</SelectItem>
                                                        <SelectItem value="union_libre">Unión Libre</SelectItem>
                                                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                                                        <SelectItem value="viudo">Viudo/a</SelectItem>
                                                        <SelectItem value="separado">Separado/a</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="estado_vital"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado Vital</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="vivo">Vivo</SelectItem>
                                                        <SelectItem value="fallecido">Fallecido</SelectItem>
                                                        <SelectItem value="desconocido">Desconocido</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Professional & Social Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Información Profesional y Redes
                                    <Separator className="flex-1" />
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="ocupacion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ocupación</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Empresario" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="profesion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Profesión</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Abogado" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="nivel_educacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nivel Educación</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="primaria">Primaria</SelectItem>
                                                    <SelectItem value="bachillerato">Bachillerato</SelectItem>
                                                    <SelectItem value="tecnico">Técnico</SelectItem>
                                                    <SelectItem value="tecnologo">Tecnólogo</SelectItem>
                                                    <SelectItem value="pregrado">Pregrado</SelectItem>
                                                    <SelectItem value="posgrado">Posgrado</SelectItem>
                                                    <SelectItem value="maestria">Maestría</SelectItem>
                                                    <SelectItem value="doctorado">Doctorado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="linkedin_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>LinkedIn URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="facebook_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Facebook URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://facebook.com/..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="instagram_handle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Instagram</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="@usuario" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="twitter_handle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Twitter/X</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="@usuario" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Emergency Contact Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Contacto de Emergencia
                                    <Separator className="flex-1" />
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contacto_emergencia_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID Contacto (Relacionado)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="UUID..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="relacion_emergencia"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Relación</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Padre, Madre, etc." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Medical & Loyalty Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Salud y Club
                                    <Separator className="flex-1" />
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tipo_sangre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>RH</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="O+" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(rh => (
                                                            <SelectItem key={rh} value={rh}>{rh}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="eps"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>EPS</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Sura" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fecha_socio"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha Socio</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(new Date(field.value + "T00:00:00"), "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccione una fecha</span>
                                                                )}
                                                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                                            }}
                                                            disabled={(date) => date > new Date()}
                                                            initialFocus
                                                            locale={es}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fecha_aniversario"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Giversario/Boda</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(new Date(field.value + "T00:00:00"), "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccione una fecha</span>
                                                                )}
                                                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                                            }}
                                                            initialFocus
                                                            locale={es}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Contacto
                                    <Separator className="flex-1" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email_principal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Principal</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="telefono_principal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono Principal</FormLabel>
                                                <FormControl>
                                                    <Input type="tel" placeholder="+57 300..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email_secundario"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Secundario</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="secundario@ejemplo.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="whatsapp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp</FormLabel>
                                                <FormControl>
                                                    <Input type="tel" placeholder="+57 300..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>


                        </form>
                    </Form>
                </div>

                {/* Sticky Footer */}
                <SheetFooter className="absolute bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-md p-4 sm:justify-between flex-row items-center gap-4">
                    <SheetClose asChild>
                        <Button variant="ghost" type="button">Cancelar</Button>
                    </SheetClose>
                    <Button onClick={form.handleSubmit(onSubmit, (errors) => {
                        console.error("Form Validation Errors:", errors)
                        toast.error("Por favor completa los campos obligatorios", {
                            description: Object.values(errors).map(e => e.message).join(", ")
                        })
                    })} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Persona
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
