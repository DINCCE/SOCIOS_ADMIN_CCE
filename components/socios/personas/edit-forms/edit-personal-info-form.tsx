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
import { DatePicker } from "@/components/ui/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { personalInfoSchema, type PersonalInfoValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditPersonalInfoFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditPersonalInfoForm({ persona, onSuccess, onCancel }: EditPersonalInfoFormProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<PersonalInfoValues>({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: {
            genero: (persona.genero as "masculino" | "femenino" | "otro" | null) || null,
            fecha_nacimiento: persona.fecha_nacimiento || null,
            lugar_nacimiento: persona.lugar_nacimiento || null,
            estado_civil: (persona.estado_civil as "soltero" | "casado" | "union_libre" | "divorciado" | "viudo" | null) || null,
            fecha_aniversario: persona.fecha_aniversario || null,
        },
    })

    async function onSubmit(values: PersonalInfoValues) {
        setIsPending(true)
        try {
            const result = await actualizarPersona(persona.id, values)
            if (result.success) {
                toast.success("Información personal actualizada")
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
                    name="genero"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Género</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar género" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="masculino">Masculino</SelectItem>
                                    <SelectItem value="femenino">Femenino</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
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
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                                <DatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar fecha de nacimiento"
                                    captionLayout="dropdown"
                                    fromYear={1900}
                                    toYear={new Date().getFullYear()}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lugar_nacimiento"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lugar de Nacimiento</FormLabel>
                            <FormControl>
                                <Input placeholder="Ciudad, País" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="estado_civil"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado Civil</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="soltero">Soltero/a</SelectItem>
                                    <SelectItem value="casado">Casado/a</SelectItem>
                                    <SelectItem value="union_libre">Unión Libre</SelectItem>
                                    <SelectItem value="divorciado">Divorciado/a</SelectItem>
                                    <SelectItem value="viudo">Viudo/a</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="fecha_aniversario"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Aniversario</FormLabel>
                            <FormControl>
                                <DatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar fecha de aniversario"
                                />
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
