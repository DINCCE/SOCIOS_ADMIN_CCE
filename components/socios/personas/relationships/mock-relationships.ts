export type RelationshipType = 'persona' | 'empresa'
export type RelationshipGroup = 'familiar' | 'laboral'

export interface Relationship {
    id: string
    tipo: RelationshipType
    grupo: RelationshipGroup
    nombre: string
    rolRelativo: string
    badges: string[]
    avatarUrl?: string | null
    activo: boolean
    fechaFin?: string
}

export const MOCK_RELATIONSHIPS: Relationship[] = [
    {
        id: "1",
        tipo: "persona",
        grupo: "familiar",
        nombre: "María Elena Gómez",
        rolRelativo: "Esposa",
        badges: ["Acudiente", "Beneficiaria"],
        avatarUrl: null,
        activo: true,
    },
    {
        id: "2",
        tipo: "empresa",
        grupo: "laboral",
        nombre: "TechCorp Solutions S.A.S",
        rolRelativo: "Empleador Actual",
        badges: ["CEO", "Fundador"],
        avatarUrl: null,
        activo: true,
    },
    {
        id: "3",
        tipo: "empresa",
        grupo: "laboral",
        nombre: "Empresa X Anterior",
        rolRelativo: "Ex-Empleador",
        badges: ["Gerente"],
        fechaFin: "2023-06-15",
        activo: false,
    },
]
