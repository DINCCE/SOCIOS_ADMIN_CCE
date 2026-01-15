"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Phone, MoreHorizontal, Plus, Check, X, Pencil, UserMinus } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type FamilyMember } from "./family-card"
import { AddFamilySheet } from "./add-family-sheet"
import { EditRelationshipDialog } from "./edit-relationship-dialog"
import { UnlinkFamilyConfirmDialog } from "./unlink-family-confirm-dialog"
import { obtenerRelaciones, type EnrichedRelationship } from "@/app/actions/relaciones"
import { cn } from "@/lib/utils"

// Mapeo de tipo_parentesco a etiqueta legible
const parentescoLabels: Record<string, string> = {
    cónyuge: "Cónyuge",
    "hijo/a": "Hijo/a",
    padre: "Padre",
    madre: "Madre",
    suegro: "Suegro",
    suegra: "Suegra",
    yerno: "Yerno",
    nuera: "Nuera",
    "hermano/a": "Hermano/a",
    otro: "Otro",
}

// Mapeo inverso para guardar (usamos los mismos valores que el backend espera)
const labelToParentesco: Record<string, string> = {
    "Cónyuge": "cónyuge",
    "Hijo/a": "hijo/a",
    "Padre": "padre",
    "Madre": "madre",
    "Suegro": "suegro",
    "Suegra": "suegra",
    "Yerno": "yerno",
    "Nuera": "nuera",
    "Hermano/a": "hermano/a",
    "Otro": "otro"
}

// Prioridad de ordenamiento hard-coded
const ROLE_PRIORITY: Record<string, number> = {
    "Cónyuge": 1,
    "Padre": 2,
    "Madre": 3,
    "Hijo/a": 4,
    "Suegro": 5,
    "Suegra": 6,
    "Yerno": 7,
    "Nuera": 8,
    "Hermano/a": 9,
    "Otro": 10,
    "Padre/Madre": 3
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
    const [isPending, setIsPending] = useState(false)

    // Estado para edición inline
    const [editingRowId, setEditingRowId] = useState<string | null>(null)
    const [editFormData, setEditFormData] = useState({ name: "", role: "", phone: "" })

    // Estado para creación inline
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [comboboxOpen, setComboboxOpen] = useState(false)
    const [creationData, setCreationData] = useState({ persona_id: "", role: "", phone: "", name: "" })

    // Cargar relaciones al montar
    const loadFamilyMembers = async () => {
        setIsLoading(true)
        try {
            const result = await obtenerRelaciones(bp_id, true)
            if (result.success && result.data) {
                const members = result.data
                    .filter((rel: EnrichedRelationship) => rel.tipo_relacion === 'familiar' && rel.es_actual !== false)
                    .map((rel: EnrichedRelationship) => {
                        const isOrigen = rel.bp_origen_id === bp_id
                        const prefix = isOrigen ? 'destino' : 'origen'

                        const relatedNombre = (isOrigen ? rel.destino_nombre_completo : rel.origen_nombre_completo) || ""
                        const relatedBpId = isOrigen ? rel.bp_destino_id : rel.bp_origen_id

                        return {
                            id: relatedBpId,
                            nombre: relatedNombre,
                            relacion: getParentescoLabel(isOrigen ? rel.rol_destino : rel.rol_origen),
                            relacion_id: rel.id,
                            codigo_bp: isOrigen ? rel.destino_codigo_bp : rel.origen_codigo_bp,
                            documento: isOrigen ? rel.destino_identificacion : rel.origen_identificacion,
                            fecha_nacimiento: isOrigen ? rel.destino_fecha_nacimiento || '' : rel.origen_fecha_nacimiento || '',
                            estado: (rel.es_actual ? 'activo' : 'inactivo') as 'activo' | 'inactivo',
                            foto: isOrigen ? rel.destino_foto : rel.origen_foto,
                            celular: isOrigen ? rel.destino_celular : rel.origen_celular,
                            email: isOrigen ? rel.destino_email : rel.origen_email,
                            avatarParams: relatedNombre.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                        }
                    })
                setFamilyMembers(members)
            }
        } catch (error) {
            console.error('Error loading family members:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadFamilyMembers()
    }, [bp_id])

    // Debounced Search for Inline Creation
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true)
                const result = await (import("@/app/actions/personas").then(m => m.buscarPersonasDisponiblesParaRelacion(
                    bp_id,
                    searchQuery,
                    organizacion_id
                )))
                // @ts-ignore
                setSearchResults(result.success ? result.data : [])
                setIsSearching(false)
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, bp_id, organizacion_id])

    const handleRefresh = async () => {
        await loadFamilyMembers()
        setEditingRowId(null)
    }

    const startEditing = (member: any) => {
        setEditingRowId(member.id)
        setEditFormData({
            name: member.nombre,
            role: member.relacion,
            phone: member.celular || "N/A"
        })
    }

    const cancelEdit = () => {
        setEditingRowId(null)
    }

    const saveEdit = async (member: any) => {
        const type = (labelToParentesco[editFormData.role] || 'otro') as any
        setIsPending(true)
        const result = await (import("@/app/actions/relaciones").then(m => m.editarTipoParentesco(member.relacion_id, type)))
        setIsPending(false)
        if (result.success) {
            import("sonner").then(m => m.toast.success("Relación actualizada"))
            handleRefresh()
        } else {
            import("sonner").then(m => m.toast.error(result.message))
        }
    }

    const handleInlineSave = async () => {
        if (!creationData.persona_id || !creationData.role) {
            import("sonner").then(m => m.toast.error("Selecciona una persona y un parentesco"))
            return
        }
        const type = labelToParentesco[creationData.role] as any
        setIsPending(true)
        const result = await (import("@/app/actions/relaciones").then(m => m.vincularFamiliar({
            bp_origen_id: bp_id,
            bp_destino_id: creationData.persona_id,
            tipo_parentesco: type,
            descripcion: `Vinculado como ${creationData.role}`
        })))
        setIsPending(false)

        if (result.success) {
            import("sonner").then(m => m.toast.success("Familiar vinculado"))
            // Loop de creación: mantener abierto pero limpio
            setCreationData({ persona_id: "", role: "", phone: "", name: "" })
            setSearchQuery("")
            handleRefresh()
        } else {
            import("sonner").then(m => m.toast.error(result.message))
        }
    }

    // Lógica de validación de roles
    const getRolesOccupied = (excludeId?: string) => {
        const members = excludeId
            ? familyMembers.filter(m => m.id !== excludeId)
            : familyMembers

        return {
            hasSpouse: members.some(m => m.relacion === 'Cónyuge'),
            hasFather: members.some(m => m.relacion === 'Padre'),
            hasMother: members.some(m => m.relacion === 'Madre'),
            hasSuegro: members.some(m => m.relacion === 'Suegro'),
            hasSuegra: members.some(m => m.relacion === 'Suegra'),
        }
    }

    // Ordenar los miembros antes de renderizar
    const sortedMembers = [...familyMembers].sort((a, b) => {
        const priorityA = ROLE_PRIORITY[a.relacion] || 99
        const priorityB = ROLE_PRIORITY[b.relacion] || 99
        return priorityA - priorityB
    })

    return (
        <div className="space-y-4">
            {/* New Table Layout */}
            <div className="rounded-md border border-border/50 overflow-hidden bg-card">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="w-[40%] text-[12px] uppercase tracking-wider font-medium text-muted-foreground py-3 pl-4">
                                Familiar
                            </TableHead>
                            <TableHead className="w-[20%] text-[12px] uppercase tracking-wider font-medium text-muted-foreground py-3">
                                Parentesco
                            </TableHead>
                            <TableHead className="w-[30%] text-[12px] uppercase tracking-wider font-medium text-muted-foreground py-3">
                                Contacto
                            </TableHead>
                            <TableHead className="w-[10%] text-[12px] uppercase tracking-wider font-medium text-muted-foreground py-3 text-right pr-4">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Fila de Creación Inline */}
                        {isCreating && (
                            <TableRow className="bg-primary/5 hover:bg-primary/5 border-b h-16 transition-all duration-300">
                                <TableCell className="pl-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between h-9 bg-background border-muted-foreground/20 text-xs",
                                                            !creationData.name && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {creationData.name || "Buscar persona..."}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <div className="p-2 border-b">
                                                        <Input
                                                            placeholder="Nombre o documento..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="h-8 text-xs"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto">
                                                        {isSearching ? (
                                                            <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                                                <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-primary" />
                                                                Buscando...
                                                            </div>
                                                        ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                                                            <div className="py-4 text-center text-xs text-muted-foreground">
                                                                No se encontraron resultados
                                                            </div>
                                                        ) : (
                                                            searchResults.map((persona) => (
                                                                <Button
                                                                    key={persona.id}
                                                                    variant="ghost"
                                                                    disabled={persona.already_linked}
                                                                    className={cn(
                                                                        "w-full justify-start font-normal h-auto py-2 px-3 text-left hover:bg-accent",
                                                                        persona.already_linked && "opacity-70"
                                                                    )}
                                                                    onClick={() => {
                                                                        setCreationData({
                                                                            ...creationData,
                                                                            persona_id: persona.id,
                                                                            name: persona.nombre_completo,
                                                                            phone: persona.telefono || "N/A"
                                                                        })
                                                                        setSearchQuery("")
                                                                        setComboboxOpen(false)
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-[13px]">{persona.nombre_completo}</span>
                                                                            {persona.already_linked && (
                                                                                <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-muted text-muted-foreground border-muted-foreground/20">
                                                                                    Ya vinculado
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[11px] text-muted-foreground">{persona.identificacion}</span>
                                                                    </div>
                                                                </Button>
                                                            ))
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={creationData.role}
                                        onValueChange={(val) => setCreationData({ ...creationData, role: val })}
                                    >
                                        <SelectTrigger className="h-9 text-xs bg-background">
                                            <SelectValue placeholder="Relación" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cónyuge" disabled={getRolesOccupied().hasSpouse}>
                                                Cónyuge {getRolesOccupied().hasSpouse && "(Reemplazará el actual)"}
                                            </SelectItem>
                                            <SelectItem value="Padre" disabled={getRolesOccupied().hasFather}>
                                                Padre {getRolesOccupied().hasFather && "(Reemplazará el actual)"}
                                            </SelectItem>
                                            <SelectItem value="Madre" disabled={getRolesOccupied().hasMother}>
                                                Madre {getRolesOccupied().hasMother && "(Reemplazará el actual)"}
                                            </SelectItem>
                                            <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                                            <SelectItem value="Suegro" disabled={getRolesOccupied().hasSuegro}>
                                                Suegro {getRolesOccupied().hasSuegro && "(Reemplazará el actual)"}
                                            </SelectItem>
                                            <SelectItem value="Suegra" disabled={getRolesOccupied().hasSuegra}>
                                                Suegra {getRolesOccupied().hasSuegra && "(Reemplazará el actual)"}
                                            </SelectItem>
                                            <SelectItem value="Yerno">Yerno</SelectItem>
                                            <SelectItem value="Nuera">Nuera</SelectItem>
                                            <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                                            <SelectItem value="Otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 h-9 px-3 rounded-md border border-dashed border-border/50">
                                        <Phone className="h-3 w-3" />
                                        <span>{creationData.phone || "—"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            onClick={handleInlineSave}
                                            disabled={isPending || !creationData.persona_id}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/5"
                                            onClick={() => setIsCreating(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {sortedMembers.map((member) => {
                            const isEditing = editingRowId === member.id
                            const rolesStatus = getRolesOccupied(member.id)
                            return (
                                <TableRow
                                    key={member.id}
                                    className={cn(
                                        "group hover:bg-muted/40 transition-colors border-b last:border-0 h-16",
                                        isEditing && "bg-muted/50"
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && isEditing) saveEdit(member)
                                        if (e.key === 'Escape' && isEditing) cancelEdit()
                                    }}
                                >
                                    {/* Columna Familiar */}
                                    <TableCell className="pl-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-border/50">
                                                <AvatarImage src={member.foto || undefined} />
                                                <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                                                    {(member as any).avatarParams}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <Link
                                                    href={`/admin/socios/personas/${member.id}`}
                                                    className="font-medium text-sm text-foreground hover:text-primary hover:underline transition-colors truncate"
                                                >
                                                    {member.nombre}
                                                </Link>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {member.email || member.documento}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Columna Parentesco */}
                                    <TableCell>
                                        {isEditing ? (
                                            <Select
                                                value={editFormData.role}
                                                onValueChange={(val) => setEditFormData({ ...editFormData, role: val })}
                                            >
                                                <SelectTrigger className="h-8 text-sm bg-background border-primary/20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cónyuge" disabled={rolesStatus.hasSpouse}>
                                                        Cónyuge {rolesStatus.hasSpouse && "(Reemplazará el actual)"}
                                                    </SelectItem>
                                                    <SelectItem value="Padre" disabled={rolesStatus.hasFather}>
                                                        Padre {rolesStatus.hasFather && "(Reemplazará el actual)"}
                                                    </SelectItem>
                                                    <SelectItem value="Madre" disabled={rolesStatus.hasMother}>
                                                        Madre {rolesStatus.hasMother && "(Reemplazará el actual)"}
                                                    </SelectItem>
                                                    <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                                                    <SelectItem value="Suegro" disabled={rolesStatus.hasSuegro}>
                                                        Suegro {rolesStatus.hasSuegro && "(Reemplazará el actual)"}
                                                    </SelectItem>
                                                    <SelectItem value="Suegra" disabled={rolesStatus.hasSuegra}>
                                                        Suegra {rolesStatus.hasSuegra && "(Reemplazará el actual)"}
                                                    </SelectItem>
                                                    <SelectItem value="Yerno">Yerno</SelectItem>
                                                    <SelectItem value="Nuera">Nuera</SelectItem>
                                                    <SelectItem value="Hermano/a">Hermano/a</SelectItem>
                                                    <SelectItem value="Otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge
                                                variant="metadata-outline"
                                                className="font-medium text-[11px] px-2.5 py-0.5"
                                            >
                                                {member.relacion}
                                            </Badge>
                                        )}
                                    </TableCell>

                                    {/* Columna Contacto */}
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-3.5 w-3.5" />
                                            <span>{member.celular || "—"}</span>
                                        </div>
                                    </TableCell>

                                    {/* Columna Acciones */}
                                    <TableCell className="text-right pr-4">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => saveEdit(member)}
                                                    disabled={isPending}
                                                >
                                                    {isPending ? <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-emerald-600" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/5"
                                                    onClick={cancelEdit}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => startEditing(member)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => {
                                                            setSelectedRelacionId(member.relacion_id)
                                                            setSelectedMemberName(member.nombre)
                                                            setUnlinkDialogOpen(true)
                                                        }}
                                                    >
                                                        <UserMinus className="h-4 w-4 mr-2" />
                                                        Desvincular
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>

                {/* Inline Add Button (Fila Fantasma) */}
                {!isCreating && (
                    <div className="border-t border-border/50">
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start pl-4 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all rounded-none font-normal"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir familiar
                        </Button>
                    </div>
                )}
            </div>

            {/* Diálogos (Preservados para futura conexión) */}
            {selectedRelacionId && (
                <>
                    <EditRelationshipDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        relacion_id={selectedRelacionId}
                        current_tipo_parentesco={"otro"} // Mock data no tiene este campo real
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
