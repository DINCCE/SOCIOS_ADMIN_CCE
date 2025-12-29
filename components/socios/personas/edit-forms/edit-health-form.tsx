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

import { healthSchema, type HealthValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditHealthFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditHealthForm({ persona, onSuccess, onCancel }: EditHealthFormProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<HealthValues>({
        resolver: zodResolver(healthSchema),
        defaultValues: {
            tipo_sangre: persona.tipo_sangre || null,
            eps: persona.eps || null,
        },
    })

    async function onSubmit(values: HealthValues) {
        setIsPending(true)
        try {
            const result = await actualizarPersona(persona.id, values)
            if (result.success) {
                toast.success("Información médica actualizada")
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
                    name="tipo_sangre"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Sangre</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: O+, AB-..." {...field} value={field.value || ""} />
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
                            <FormLabel>Entidad de Salud (EPS)</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre de la EPS" {...field} value={field.value || ""} />
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
