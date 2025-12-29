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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { professionalSchema, type ProfessionalValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditProfessionalFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditProfessionalForm({ persona, onSuccess, onCancel }: EditProfessionalFormProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ProfessionalValues>({
        resolver: zodResolver(professionalSchema),
        defaultValues: {
            nivel_educacion: persona.nivel_educacion || null,
            profesion: persona.profesion || null,
            ocupacion: persona.ocupacion || null,
        },
    })

    async function onSubmit(values: ProfessionalValues) {
        setIsPending(true)
        try {
            const result = await actualizarPersona(persona.id, values)
            if (result.success) {
                toast.success("Perfil profesional actualizado")
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
                    name="nivel_educacion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nivel Educativo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar nivel" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="primaria">Primaria</SelectItem>
                                    <SelectItem value="secundaria">Secundaria</SelectItem>
                                    <SelectItem value="tecnico">Técnico/Tecnólogo</SelectItem>
                                    <SelectItem value="universitario">Universitario</SelectItem>
                                    <SelectItem value="posgrado">Posgrado/Maestría/PhD</SelectItem>
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
                            <FormLabel>Profesión</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Ingeniero, Abogado..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="ocupacion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ocupación Actual</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Gerente, Consultor..." {...field} value={field.value || ""} />
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
