"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Users } from "lucide-react"
import { MOCK_RELATIONSHIPS, Relationship } from "./mock-relationships"
import { RelationshipRow } from "./relationship-row"
import { RelationshipsEmptyState } from "./relationships-empty-state"
import { RelationshipFormSheet } from "./relationship-form-sheet"

export function RelationshipsTab() {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const relationships = MOCK_RELATIONSHIPS
    const hasData = relationships.length > 0

    // Filter Groups
    const familyGroup = relationships.filter(r => r.grupo === 'familiar' && r.activo)
    const workGroup = relationships.filter(r => r.grupo === 'laboral' && r.activo)
    const historyGroup = relationships.filter(r => !r.activo)

    if (!hasData) {
        return (
            <div className="max-w-4xl mx-auto py-6">
                <RelationshipsEmptyState onAddClick={() => setIsSheetOpen(true)} />
                <RelationshipFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-2">

            {/* HEADER */}
            <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold tracking-tight">Red de Relaciones</h2>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {relationships.length}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-medium"
                    onClick={() => setIsSheetOpen(true)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir
                </Button>
            </div>

            {/* CONTENT GROUPS */}
            <div className="space-y-10">

                {/* 1. Family Circle */}
                {familyGroup.length > 0 && (
                    <section>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                            Círculo Familiar
                        </h3>
                        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                            {familyGroup.map(rel => (
                                <RelationshipRow key={rel.id} relationship={rel} />
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Professional Life */}
                {workGroup.length > 0 && (
                    <section>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                            Vida Profesional
                        </h3>
                        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
                            {workGroup.map(rel => (
                                <RelationshipRow key={rel.id} relationship={rel} />
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. History (Inactive) */}
                {historyGroup.length > 0 && (
                    <section>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                            Historial
                        </h3>
                        <div className="border rounded-lg bg-slate-50/50 overflow-hidden">
                            {historyGroup.map(rel => (
                                <RelationshipRow key={rel.id} relationship={rel} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <RelationshipFormSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
        </div>
    )
}
