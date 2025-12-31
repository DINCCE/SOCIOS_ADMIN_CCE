"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { emergencySchema, type EmergencyValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditEmergencyFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditEmergencyForm({ persona, onSuccess, onCancel }: EditEmergencyFormProps) {
    const [isPending, setIsPending] = useState(false)

    type PerfilPreferencias = Record<string, unknown>
    const prefs = (persona.perfil_preferencias || {}) as PerfilPreferencias

    const form = useForm<EmergencyValues>({
        resolver: zodResolver(emergencySchema),
        defaultValues: {
            nombre_contacto_emergencia: persona.nombre_contacto_emergencia || null,
            relacion_emergencia: persona.relacion_emergencia || null,
            protocolo_emergencia: (prefs.protocolo_emergencia as string | undefined) || "Estándar",
        },
    })

    async function onSubmit(values: EmergencyValues) {
        setIsPending(true)
        try {
            const updatedData = {
                nombre_contacto_emergencia: values.nombre_contacto_emergencia,
                relacion_emergencia: values.relacion_emergencia,
                perfil_preferencias: {
                    ...prefs,
                    protocolo_emergencia: values.protocolo_emergencia
                }
            }

            const result = await actualizarPersona(persona.id, updatedData)
            if (result.success) {
                toast.success("Contacto de emergencia actualizado")
                onSuccess()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error al actualizar la información")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="nombre_contacto_emergencia"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Contacto</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre completo" {...field} value={field.value || ""} />
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
                            <FormLabel>Parentesco / Relación</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Cónyuge, Padre, Hermano..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="protocolo_emergencia"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Protocolo de Emergencia</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Llamar a médico personal, Traslado a Clínica..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Form>
    )
}
