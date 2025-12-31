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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Persona } from "@/features/socios/types/socios-schema"

// Schema de validación
const securitySchema = z.object({
    tipo_sangre: z.string().optional().nullable(),
    eps: z.string().optional().nullable(),
    contacto_emergencia_id: z.string().uuid().optional().nullable(),
    relacion_emergencia: z.string().optional().nullable(),
})

type SecurityFormValues = z.infer<typeof securitySchema>

interface EditSecurityFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditSecurityForm({ persona, onSuccess, onCancel }: EditSecurityFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const form = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            tipo_sangre: persona.tipo_sangre || "",
            eps: persona.eps || "",
            contacto_emergencia_id: persona.contacto_emergencia_id || undefined,
            relacion_emergencia: persona.relacion_emergencia || "",
        },
    })

    async function onSubmit(data: SecurityFormValues) {
        setIsPending(true)
        try {
            // TODO: Implement API call to update security data
            console.log("Update security:", data)

            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success("Datos de salud y emergencia actualizados")
            router.refresh()
            onSuccess()
        } catch (error) {
            toast.error("Error al actualizar datos de seguridad")
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
                    <SheetTitle className="text-lg font-semibold">Salud & Emergencia</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Actualiza información médica y contacto de emergencia del socio.
                    </SheetDescription>
                </SheetHeader>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6">
                <Form {...form}>
                    <form id="edit-security-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Información Médica */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Información Médica</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="tipo_sangre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Grupo Sanguíneo</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="O+, A+, etc." {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eps"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">EPS / Prepagada</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Nombre de la EPS" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Contacto de Emergencia */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Contacto de Emergencia</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contacto_emergencia_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID Contacto</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="h-9 font-mono"
                                                    placeholder="UUID del contacto"
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
                                    name="relacion_emergencia"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Parentesco</FormLabel>
                                            <FormControl>
                                                <Input className="h-9" placeholder="Esposo/a, Hijo/a, etc." {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                Nota: El selector de contacto de emergencia será implementado próximamente para buscar en la tabla de personas.
                            </p>
                        </div>
                    </form>
                </Form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-background shrink-0 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" form="edit-security-form" disabled={isPending}>
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
