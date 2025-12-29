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

import { residenceSchema, type ResidenceValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditResidenceFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditResidenceForm({ persona, onSuccess, onCancel }: EditResidenceFormProps) {
    const [isPending, setIsPending] = useState(false)

    // Extract from JSONB if exists, otherwise null
    const prefs = persona.perfil_preferencias as any

    const form = useForm<ResidenceValues>({
        resolver: zodResolver(residenceSchema),
        defaultValues: {
            direccion: prefs?.direccion_residencia?.direccion || null,
            barrio: prefs?.direccion_residencia?.barrio || null,
            ciudad: prefs?.direccion_residencia?.ciudad || null,
        },
    })

    async function onSubmit(values: ResidenceValues) {
        setIsPending(true)
        try {
            // For JSONB we need to merge with existing data
            const updatedPrefs = {
                ...prefs,
                direccion_residencia: {
                    ...(prefs?.direccion_residencia || {}),
                    ...values
                }
            }

            const result = await actualizarPersona(persona.id, { perfil_preferencias: updatedPrefs })
            if (result.success) {
                toast.success("Información de residencia actualizada")
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
                    name="direccion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                                <Input placeholder="Calle, Carrera, Apto..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="barrio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Barrio / Sector</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre del barrio" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="ciudad"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                                <Input placeholder="Ciudad" {...field} value={field.value || ""} />
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
