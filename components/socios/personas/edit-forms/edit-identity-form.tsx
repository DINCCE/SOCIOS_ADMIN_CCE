"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Persona } from "@/features/socios/types/socios-schema"
import { updatePersonaIdentity } from "@/app/actions/personas"

// Schema de validación
const identitySchema = z.object({
    tipo_documento: z.enum(["CC", "CE", "TI", "PA", "RC", "NIT", "PEP", "PPT", "DNI", "NUIP"]),
    numero_documento: z.string().min(1, "Número de documento requerido"),
    fecha_expedicion: z.string().optional().nullable(),
    lugar_expedicion: z.string().optional().nullable(),
    primer_nombre: z.string().min(1, "Primer nombre requerido"),
    segundo_nombre: z.string().optional().nullable(),
    primer_apellido: z.string().min(1, "Primer apellido requerido"),
    segundo_apellido: z.string().optional().nullable(),
    genero: z.enum(["masculino", "femenino", "otro", "no_especifica"]),
    fecha_nacimiento: z.string(),
    lugar_nacimiento: z.string().optional().nullable(),
    nacionalidad: z.string().optional().nullable(),
    estado_civil: z.enum(["soltero", "casado", "union_libre", "divorciado", "viudo", "separado"]).optional().nullable(),
})

type IdentityFormValues = z.infer<typeof identitySchema>

interface EditIdentityFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditIdentityForm({ persona, onSuccess, onCancel }: EditIdentityFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const form = useForm<IdentityFormValues>({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            tipo_documento: persona.tipo_documento,
            numero_documento: persona.numero_documento,
            fecha_expedicion: persona.fecha_expedicion || "",
            lugar_expedicion: persona.lugar_expedicion || "",
            primer_nombre: persona.primer_nombre,
            segundo_nombre: persona.segundo_nombre || "",
            primer_apellido: persona.primer_apellido,
            segundo_apellido: persona.segundo_apellido || "",
            genero: persona.genero,
            fecha_nacimiento: persona.fecha_nacimiento,
            lugar_nacimiento: persona.lugar_nacimiento || "",
            nacionalidad: persona.nacionalidad || "Colombia",
            estado_civil: persona.estado_civil || undefined,
        },
    })

    async function onSubmit(data: IdentityFormValues) {
        setIsPending(true)
        try {
            // Convert empty strings to null for optional fields
            const cleanedData = {
                ...data,
                fecha_expedicion: data.fecha_expedicion || null,
                lugar_expedicion: data.lugar_expedicion || null,
                segundo_nombre: data.segundo_nombre || null,
                segundo_apellido: data.segundo_apellido || null,
                lugar_nacimiento: data.lugar_nacimiento || null,
                nacionalidad: data.nacionalidad || null,
                estado_civil: data.estado_civil || null,
            }

            const result = await updatePersonaIdentity(persona.id, cleanedData)

            if (!result.success) {
                toast.error(result.message)
                return
            }

            toast.success(result.message)
            router.refresh()
            onSuccess()
        } catch (error) {
            toast.error("Error al actualizar datos de identidad")
            console.error(error)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b shrink-0">
                <SheetHeader className="text-left">
                    <SheetTitle className="text-lg font-semibold">Identificación Personal</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Actualiza los datos de identidad, biometría y estado civil del socio.
                    </SheetDescription>
                </SheetHeader>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6">
                <Form {...form}>
                    <form id="edit-identity-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Documento de Identidad */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Documento de Identidad</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="tipo_documento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CC">Cédula (CC)</SelectItem>
                                                    <SelectItem value="CE">Extranjería (CE)</SelectItem>
                                                    <SelectItem value="TI">T. Identidad (TI)</SelectItem>
                                                    <SelectItem value="PA">Pasaporte (PA)</SelectItem>
                                                    <SelectItem value="RC">Registro Civil (RC)</SelectItem>
                                                    <SelectItem value="NIT">NIT</SelectItem>
                                                    <SelectItem value="PEP">PEP</SelectItem>
                                                    <SelectItem value="PPT">PPT</SelectItem>
                                                    <SelectItem value="DNI">DNI</SelectItem>
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
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Número</FormLabel>
                                            <FormControl>
                                                <Input className="h-9 font-mono" placeholder="123456789" {...field} />
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
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha Expedición</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar fecha"
                                                    className="h-9"
                                                    captionLayout="dropdown"
                                                    fromYear={1930}
                                                    toYear={new Date().getFullYear()}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lugar_expedicion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lugar Expedición</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Ciudad" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Nombres */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombres y Apellidos</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="primer_nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Primer Nombre</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Juan" {...field} />
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
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Segundo Nombre</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="(Opcional)" {...field} value={field.value || ""} />
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
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Primer Apellido</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Pérez" {...field} />
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
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Segundo Apellido</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="(Opcional)" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Biometría */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Biometría</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="genero"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Género</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fecha_nacimiento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de Nacimiento</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar fecha"
                                                    captionLayout="dropdown"
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                    className="h-9"
                                                />
                                            </FormControl>
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
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lugar de Nacimiento</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Ciudad, País" {...field} value={field.value || ""} />
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
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nacionalidad</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Colombia" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="estado_civil"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado Civil</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Seleccionar" />
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
                            </div>
                        </div>
                    </form>
                </Form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-background shrink-0 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" form="edit-identity-form" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        "Guardar Cambios"
                    )}
                </Button>
            </div>
        </div>
    )
}
