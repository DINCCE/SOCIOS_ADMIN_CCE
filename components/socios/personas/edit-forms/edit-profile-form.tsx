"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Persona } from "@/features/socios/types/socios-schema"

interface EditProfileFormProps {
    persona: Persona
    onSuccess: () => void
    onCancel: () => void
}

export function EditProfileForm({ persona, onSuccess, onCancel }: EditProfileFormProps) {
    const [isPending] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            // TODO: Implement API call
            toast.success("Datos de perfil y contacto actualizados")
            router.refresh()
            onSuccess()
        } catch (error) {
            toast.error("Error al actualizar perfil")
            console.error(error)
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
                <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                            Datos del Club
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Código: <span className="font-mono text-foreground">{persona.codigo}</span>
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                            Los datos del club (código, estado, fechas) son de solo lectura en esta vista.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                            Perfil Profesional
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Formulario de profesión, ocupación y redes sociales en desarrollo...
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                            Medios de Contacto
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Formulario de emails y teléfonos en desarrollo...
                        </p>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-background shrink-0 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" form="edit-profile-form" disabled={isPending}>
                    Guardar Cambios
                </Button>
            </div>
        </div>
    )
}
