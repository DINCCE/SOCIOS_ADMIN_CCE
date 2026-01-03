"use client"

import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

export function RelationshipsEmptyState({ onAddClick }: { onAddClick: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/10 border-muted-foreground/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-sm mb-4">
                <Users className="h-8 w-8 text-muted-foreground/40" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1">
                Sin conexiones aún
            </h3>

            <p className="text-sm text-muted-foreground max-w-sm mb-6">
                No hay relaciones registradas para esta persona. Añade familiares, empleadores o referencias para completar su perfil.
            </p>

            <Button variant="outline" className="gap-2" onClick={onAddClick}>
                <Plus className="h-4 w-4" />
                Añadir primera relación
            </Button>
        </div>
    )
}
