"use client"

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FamilyCard, type FamilyMember } from "./family-card"

interface FamilyGridProps {
    members: FamilyMember[]
    isLoading?: boolean
    onAddClick: () => void
    onEditMember: (id: string) => void
    onRemoveMember: (id: string) => void
}

export function FamilyGrid({ members, isLoading, onAddClick, onEditMember, onRemoveMember }: FamilyGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <div key={i} className="h-24 rounded-lg border bg-muted/10 animate-pulse" />
                ))}
            </div>
        )
    }

    if (members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed h-64">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">Sin grupo familiar</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    Este socio no tiene grupo familiar registrado actualmente.
                </p>
                <Button onClick={onAddClick} variant="outline" size="sm">
                    Añadir familiar
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
                <FamilyCard
                    key={member.id}
                    member={member}
                    onEdit={onEditMember}
                    onRemove={onRemoveMember}
                />
            ))}

            {/* Optional "Add" card at the end of grid? Or just rely on header button? 
          User spec said "Layout: grid grid-cols-1 md:grid-cols-2 gap-4". 
          We'll stick to rendering cards only. Use header button for adding. 
      */}
        </div>
    )
}
