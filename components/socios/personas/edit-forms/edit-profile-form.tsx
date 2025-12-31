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

// Schema de validación
const profileSchema = z.object({
    // Datos institucionales
    estado: z.enum(["activo", "inactivo", "suspendido"]),
    fecha_socio: z.string().optional().nullable(),
    fecha_aniversario: z.string().optional().nullable(),
    // Perfil profesional
    nivel_educacion: z.enum(["primaria", "bachillerato", "tecnico", "tecnologo", "pregrado", "posgrado", "maestria", "doctorado"]).optional().nullable(),
    profesion: z.string().optional().nullable(),
    ocupacion: z.string().optional().nullable(),
    // Redes sociales
    linkedin_url: z.string().url().optional().nullable().or(z.literal("")),
    instagram_handle: z.string().optional().nullable(),
    twitter_handle: z.string().optional().nullable(),
    facebook_url: z.string().url().optional().nullable().or(z.literal("")),
    // Medios de contacto
    email_principal: z.string().email("Email inválido").optional().nullable(),
    telefono_principal: z.string().optional().nullable(),
    email_secundario: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
    telefono_secundario: z.string().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface EditProfileFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditProfileForm({ persona, onSuccess, onCancel }: EditProfileFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            estado: persona.estado,
            fecha_socio: persona.fecha_socio || "",
            fecha_aniversario: persona.fecha_aniversario || "",
            nivel_educacion: persona.nivel_educacion || undefined,
            profesion: persona.profesion || "",
            ocupacion: persona.ocupacion || "",
            linkedin_url: persona.linkedin_url || "",
            instagram_handle: persona.instagram_handle || "",
            twitter_handle: persona.twitter_handle || "",
            facebook_url: persona.facebook_url || "",
            email_principal: persona.email_principal || "",
            telefono_principal: persona.telefono_principal || "",
            email_secundario: persona.email_secundario || "",
            telefono_secundario: persona.telefono_secundario || "",
            whatsapp: persona.whatsapp || "",
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        setIsPending(true)
        try {
            // TODO: Implement API call to update persona profile
            console.log("Update profile:", data)

            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success("Datos de perfil y contacto actualizados")
            router.refresh()
            onSuccess()
        } catch (error) {
            toast.error("Error al actualizar perfil")
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
                    <SheetTitle className="text-lg font-semibold">Vinculación & Contacto</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Actualiza datos del club, perfil profesional y medios de contacto.
                    </SheetDescription>
                </SheetHeader>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6">
                <Form {...form}>
                    <form id="edit-profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Sección 1: Datos Institucionales */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Datos Institucionales</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Código Socio (Read-only)</FormLabel>
                                    <Input
                                        className="h-9 font-mono bg-muted/40"
                                        value={persona.codigo}
                                        disabled
                                    />
                                </FormItem>
                                <FormField
                                    control={form.control}
                                    name="estado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="activo">Activo</SelectItem>
                                                    <SelectItem value="inactivo">Inactivo</SelectItem>
                                                    <SelectItem value="suspendido">Suspendido</SelectItem>
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
                                    name="fecha_socio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de Ingreso</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar fecha"
                                                    className="h-9"
                                                    captionLayout="dropdown"
                                                    fromYear={1980}
                                                    toYear={new Date().getFullYear()}
                                                    disabled
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fecha_aniversario"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de Aniversario</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar fecha"
                                                    className="h-9"
                                                    captionLayout="dropdown"
                                                    fromYear={1950}
                                                    toYear={new Date().getFullYear()}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Sección 2: Perfil Profesional */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Perfil Profesional</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nivel_educacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nivel Educativo</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Seleccionar" />
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
                                <FormField
                                    control={form.control}
                                    name="profesion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Profesión</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Ej: Ingeniero" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="ocupacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ocupación Actual</FormLabel>
                                        <FormControl>
                                            <Input className="h-9" placeholder="Ej: Gerente de Operaciones" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Redes Sociales */}
                            <div className="space-y-4 pt-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Redes Sociales</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="linkedin_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">LinkedIn</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="h-9"
                                                        placeholder="https://linkedin.com/in/..."
                                                        {...field}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="instagram_handle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Instagram</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="h-9"
                                                        placeholder="@usuario"
                                                        {...field}
                                                        value={field.value || ""}
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
                                        name="twitter_handle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Twitter/X</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="h-9"
                                                        placeholder="@usuario"
                                                        {...field}
                                                        value={field.value || ""}
                                                    />
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
                                                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Facebook</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="h-9"
                                                        placeholder="https://facebook.com/..."
                                                        {...field}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Medios de Contacto */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Medios de Contacto</h4>
                            <FormField
                                control={form.control}
                                name="email_principal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Principal</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-9"
                                                type="email"
                                                placeholder="usuario@ejemplo.com"
                                                {...field}
                                                value={field.value || ""}
                                            />
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
                                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Teléfono Principal</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-9"
                                                placeholder="+57 3..."
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="email_secundario"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Secundario</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-9"
                                                    type="email"
                                                    placeholder="(Opcional)"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telefono_secundario"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Teléfono Secundario</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-9"
                                                    placeholder="(Opcional)"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-9"
                                                placeholder="+57 3..."
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </form>
                </Form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-background shrink-0 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" form="edit-profile-form" disabled={isPending}>
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
