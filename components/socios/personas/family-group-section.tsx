"use client"

import { useEffect, useState } from "react"
import { Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { FamilyCard, type FamilyMember } from "./family-card"
import { AddFamilySheet } from "./add-family-sheet"
import { EditRelationshipDialog } from "./edit-relationship-dialog"
import { UnlinkFamilyConfirmDialog } from "./unlink-family-confirm-dialog"
import { obtenerRelaciones } from "@/app/actions/relaciones"

// Mapeo de tipo_parentesco a etiqueta legible
const parentescoLabels: Record<string, string> = {
    esposo_a: "Cónyuge",
    hijo_a: "Hijo/a",
    padre_madre: "Padre/Madre",
    hermano_a: "Hermano/a",
    otro: "Otro"
}

function getParentescoLabel(tipo: string): string {
    return parentescoLabels[tipo] || "Otro"
}

interface FamilyGroupSectionProps {
    bp_id: string
    organizacion_id: string
}

export function FamilyGroupSection({ bp_id, organizacion_id }: FamilyGroupSectionProps) {
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false)
    const [selectedRelacionId, setSelectedRelacionId] = useState<string | null>(null)
    const [selectedMemberName, setSelectedMemberName] = useState<string>("")

    // Cargar relaciones al montar
    useEffect(() => {
        async function loadFamilyMembers() {
            setIsLoading(true)
            const result = await obtenerRelaciones(bp_id, true)
            
            if (result.success && result.data) {
                // Log para diagnóstico: ver todas las relaciones recibidas
                console.log('🔍 [FamilyGroupSection] Todas las relaciones:', result.data)
                console.log('🔍 [FamilyGroupSection] Cantidad total de relaciones:', result.data.length)
                
                // Transformar relaciones a formato FamilyMember
                const members = result.data
                    .filter((rel: any) => {
                        console.log('🔍 [FamilyGroupSection] Filtrando relación:', {
                            id: rel.id,
                            tipo_relacion: rel.tipo_relacion,
                            bp_origen_id: rel.bp_origen_id,
                            bp_destino_id: rel.bp_destino_id,
                            es_actual: rel.es_actual
                        })
                        // Filtrar solo relaciones familiares activas
                        return rel.tipo_relacion === 'familiar' && rel.es_actual !== false
                    })
                    .map((rel: any) => {
                        // Determinar si es origen o destino para obtener datos correctos
                        const isOrigen = rel.bp_origen_id === bp_id
                        const relatedBpId = isOrigen ? rel.bp_destino_id : rel.bp_origen_id

                        // Seleccionar campos según si la persona actual es origen o destino
                        // Si bp_id es origen, usamos campos destino; si bp_id es destino, usamos campos origen
                        const prefix = isOrigen ? 'destino' : 'origen'

                        // Build name from available fields (nombre_completo or individual fields)
                        const relatedNombre = rel[`${prefix}_nombre_completo`] ||
                            [
                                rel[`${prefix}_primer_nombre`],
                                rel[`${prefix}_segundo_nombre`],
                                rel[`${prefix}_primer_apellido`],
                                rel[`${prefix}_segundo_apellido`]
                            ]
                            .filter(Boolean)
                            .join(' ')

                        // Get codigo_bp from the related person
                        const relatedCodigoBp = rel[`${prefix}_codigo_bp`] || ''

                        // Get document (already formatted by RPC)
                        const relatedDocumento = rel[`${prefix}_identificacion`] || ''

                        return {
                            id: relatedBpId,
                            nombre: relatedNombre,
                            relacion: getParentescoLabel((rel.atributos?.tipo_parentesco as string) || 'otro'),
                            relacion_id: rel.id,
                            codigo_bp: relatedCodigoBp,
                            documento: relatedDocumento,
                            fecha_nacimiento: rel[`${prefix}_fecha_nacimiento`] || '',
                            estado: rel.es_actual ? 'activo' : 'inactivo',
                            foto: rel[`${prefix}_foto_url`] || null,
                            celular: rel[`${prefix}_whatsapp`] || null,
                            email: rel[`${prefix}_email`] || null,
                        }
                    })
                
                console.log('🔍 [FamilyGroupSection] Miembros familiares filtrados:', members)
                setFamilyMembers(members)
            } else {
                console.error('❌ [FamilyGroupSection] Error al cargar relaciones:', result.message)
            }
            setIsLoading(false)
        }

        loadFamilyMembers()
    }, [bp_id])

    const handleEditRole = (memberId: string, relacionId: string) => {
        setSelectedRelacionId(relacionId)
        setEditDialogOpen(true)
    }

    const handleUnlink = (memberId: string, relacionId: string, memberName: string) => {
        setSelectedRelacionId(relacionId)
        setSelectedMemberName(memberName)
        setUnlinkDialogOpen(true)
    }

    const handleRefresh = () => {
        // Reload family members
        async function loadFamilyMembers() {
            setIsLoading(true)
            const result = await obtenerRelaciones(bp_id, true)
            
            if (result.success && result.data) {
                const members = result.data
                    .filter((rel: any) => rel.tipo_relacion === 'familiar' && rel.es_actual !== false)
                    .map((rel: any) => {
                        // Determinar si es origen o destino para obtener datos correctos
                        const isOrigen = rel.bp_origen_id === bp_id
                        const relatedBpId = isOrigen ? rel.bp_destino_id : rel.bp_origen_id

                        // Seleccionar campos según si la persona actual es origen o destino
                        // Si bp_id es origen, usamos campos destino; si bp_id es destino, usamos campos origen
                        const prefix = isOrigen ? 'destino' : 'origen'

                        // Build name from available fields (nombre_completo or individual fields)
                        const relatedNombre = rel[`${prefix}_nombre_completo`] ||
                            [
                                rel[`${prefix}_primer_nombre`],
                                rel[`${prefix}_segundo_nombre`],
                                rel[`${prefix}_primer_apellido`],
                                rel[`${prefix}_segundo_apellido`]
                            ]
                            .filter(Boolean)
                            .join(' ')

                        // Get codigo_bp from the related person
                        const relatedCodigoBp = rel[`${prefix}_codigo_bp`] || ''

                        // Get document (already formatted by RPC)
                        const relatedDocumento = rel[`${prefix}_identificacion`] || ''

                        return {
                            id: relatedBpId,
                            nombre: relatedNombre,
                            relacion: getParentescoLabel((rel.atributos?.tipo_parentesco as string) || 'otro'),
                            relacion_id: rel.id,
                            codigo_bp: relatedCodigoBp,
                            documento: relatedDocumento,
                            fecha_nacimiento: rel[`${prefix}_fecha_nacimiento`] || '',
                            estado: rel.es_actual ? 'activo' : 'inactivo',
                            foto: rel[`${prefix}_foto_url`] || null,
                            celular: rel[`${prefix}_whatsapp`] || null,
                            email: rel[`${prefix}_email`] || null,
                        }
                    })
                
                console.log('🔄 [FamilyGroupSection] Miembros recargados:', members)
                setFamilyMembers(members)
            } else {
                console.error('❌ [FamilyGroupSection] Error al recargar relaciones:', result.message)
            }
            setIsLoading(false)
        }

        loadFamilyMembers()
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        Grupo Familiar
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona el núcleo familiar y los beneficiarios del socio.
                    </p>
                </div>
                <AddFamilySheet 
                    bp_origen_id={bp_id}
                    organizacion_id={organizacion_id}
                    onSuccess={handleRefresh}
                />
            </div>

            {/* Content Section */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Cargando grupo familiar...
                </div>
            ) : familyMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {familyMembers.map(member => (
                        <FamilyCard
                            key={`${member.id}-${member.relacion_id}`}
                            member={member}
                            onViewProfile={() => {
                                // Navigation is handled inside FamilyCard
                            }}
                            onEditRole={(memberId) => handleEditRole(memberId, member.relacion_id)}
                            onUnlink={(memberId) => handleUnlink(memberId, member.relacion_id, member.nombre)}
                        />
                    ))}
                </div>
            ) : (
                /* Empty State */
                <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/20">
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                <Users className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-foreground">
                                    Sin grupo familiar
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-[280px]">
                                    Este socio aún no tiene familiares vinculados.
                                </p>
                            </div>
                            <AddFamilySheet 
                                bp_origen_id={bp_id}
                                organizacion_id={organizacion_id}
                                onSuccess={handleRefresh}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Diálogos */}
            {selectedRelacionId && (
                <>
                    <EditRelationshipDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        relacion_id={selectedRelacionId}
                        current_tipo_parentesco={familyMembers.find(m => m.relacion_id === selectedRelacionId)?.relacion || 'otro'}
                        onSuccess={handleRefresh}
                    />
                    <UnlinkFamilyConfirmDialog
                        open={unlinkDialogOpen}
                        onOpenChange={setUnlinkDialogOpen}
                        relacion_id={selectedRelacionId}
                        memberName={selectedMemberName}
                        onSuccess={handleRefresh}
                    />
                </>
            )}
        </div>
    )
}
