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

import { institutionalSchema, type InstitutionalValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditInstitutionalFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditInstitutionalForm({ persona, onSuccess, onCancel }: EditInstitutionalFormProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<InstitutionalValues>({
        resolver: zodResolver(institutionalSchema),
        defaultValues: {
            fecha_socio: persona.fecha_socio || null,
            estado: (persona.estado as any) || "activo",
            estado_vital: (persona.estado_vital as any) || "vivo",
            tags: persona.tags || [],
        },
    })

    async function onSubmit(values: InstitutionalValues) {
        setIsPending(true)
        try {
            const result = await actualizarPersona(persona.id, values)
            if (result.success) {
                toast.success("Vínculo institucional actualizado")
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
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Código de Socio
                    </label>
                    <Input value={persona.codigo || "Autogenerado"} disabled className="bg-muted" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Solo lectura</p>
                </div>

                <FormField
                    control={form.control}
                    name="fecha_socio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Ingreso</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado del Socio</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="activo">Activo</SelectItem>
                                    <SelectItem value="inactivo">Inactivo</SelectItem>
                                    <SelectItem value="mora">Mora</SelectItem>
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
                                        <SelectValue placeholder="Seleccionar estado vital" />
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
