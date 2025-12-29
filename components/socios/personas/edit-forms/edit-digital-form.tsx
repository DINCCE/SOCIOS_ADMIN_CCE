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

import { digitalSchema, type DigitalValues } from "@/lib/schemas/edit-persona-schemas"
import { actualizarPersona } from "@/app/actions/personas"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditDigitalFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditDigitalForm({ persona, onSuccess, onCancel }: EditDigitalFormProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<DigitalValues>({
        resolver: zodResolver(digitalSchema),
        defaultValues: {
            email_secundario: persona.email_secundario || null,
            whatsapp: persona.whatsapp || null,
            linkedin_url: persona.linkedin_url || null,
            facebook_url: persona.facebook_url || null,
            instagram_handle: persona.instagram_handle || null,
        },
    })

    async function onSubmit(values: DigitalValues) {
        setIsPending(true)
        try {
            const result = await actualizarPersona(persona.id, values)
            if (result.success) {
                toast.success("Ecosistema digital actualizado")
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
                    name="email_secundario"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Secundario</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="example@mail.com" {...field} value={field.value || ""} />
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
                                <Input placeholder="+57 ..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL LinkedIn</FormLabel>
                            <FormControl>
                                <Input placeholder="https://linkedin.com/in/..." {...field} value={field.value || ""} />
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
                            <FormLabel>URL Facebook</FormLabel>
                            <FormControl>
                                <Input placeholder="https://facebook.com/..." {...field} value={field.value || ""} />
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
                            <FormLabel>Instagram (@usuario)</FormLabel>
                            <FormControl>
                                <Input placeholder="@usuario" {...field} value={field.value || ""} />
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
