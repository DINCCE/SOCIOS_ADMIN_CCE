"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FamilyGrid } from "./family-grid"
import { AddFamilySheet } from "./add-family-sheet"
import { FamilyMember } from "./family-card"
import { useFamilyGroup } from "@/hooks/use-family-module"

export function FamilyGroupTab() {
    const params = useParams()
    const bpId = params.id as string

    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Fetch real data
    const { data: familyGroup, isLoading } = useFamilyGroup(bpId)

    // Map to FamilyMember type if needed, though hook already maps basic fields.
    // Ensure types match FamilyGrid expectations.
    const members: FamilyMember[] = (familyGroup || []).map((item: any) => ({
        id: item.id,
        person_id: item.person_id,
        name: item.nombre_completo,
        relation: item.rol_destino || "Familiar",
        estado: item.estado,
        tipo_documento: item.tipo_documento,
        numero_documento: item.numero_documento,
        edad: item.edad,
        celular: item.celular,
        email: item.email,
        foto_url: item.foto_url,

        // Fallback for badges until we add them to RPC/Schema
        es_beneficiario: false,
        es_acudiente: false,
        es_emergencia: false,
    }))

    const handleEdit = (id: string) => {
        console.log("Edit member", id)
        // Add logic to open edit sheet if needed
    }

    const handleRemove = (id: string) => {
        console.log("Remove member", id)
        // Add logic to call remove mutation
    }

    if (isLoading) {
        // Fallback handled inside grid or keep minimal if really needed, 
        // but user wants header visible.
        // We will pass isLoading to FamilyGrid
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">Grupo Familiar</h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona los miembros de la familia vinculados a este socio.
                    </p>
                </div>
                <Button onClick={() => setIsSheetOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Añadir familiar
                </Button>
            </div>

            <FamilyGrid
                members={members}
                isLoading={isLoading}
                onAddClick={() => setIsSheetOpen(true)}
                onEditMember={handleEdit}
                onRemoveMember={handleRemove}
            />

            <AddFamilySheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </div>
    )
}
